import * as vscode from 'vscode';
import { MCPServerConfig, ServerStatus, ServerProcess } from './types/mcp';

export class MCPServerManager implements vscode.Disposable {
    private runningTasks: Map<string, vscode.Task> = new Map();
    private terminals: Map<string, vscode.Terminal> = new Map();
    private serverProcesses: Map<string, ServerProcess> = new Map();
    private outputChannel: vscode.OutputChannel;
    private healthCheckInterval: NodeJS.Timeout | undefined;
    private retryAttempts: Map<string, number> = new Map();
    private readonly maxRetryAttempts = 3;
    private readonly healthCheckIntervalMs = 30000; // 30 seconds

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.startHealthMonitoring();
    }

    /**
     * Start a server using VSCode Task API
     */
    async startServer(config: MCPServerConfig): Promise<void> {
        if (this.getServerStatus(config.id) === 'running') {
            this.outputChannel.appendLine(`[INFO] Server ${config.name} is already running`);
            return;
        }

        try {
            this.updateServerStatus(config.id, 'starting');

            if (config.type === 'http' || config.type === 'sse') {
                // For HTTP/SSE servers, we don't need to start a process
                // but we still need to track them
                const serverProcess: ServerProcess = {
                    id: config.id,
                    startTime: new Date(),
                    status: 'running'
                };
                this.serverProcesses.set(config.id, serverProcess);

                this.outputChannel.appendLine(`[INFO] HTTP/SSE server ${config.name} configured at ${config.url}`);
                this.updateServerStatus(config.id, 'running');
                return;
            }

            if (!config.command) {
                throw new Error('No command specified for stdio server');
            }

            // Use VSCode Task API for process management
            const taskDefinition: vscode.TaskDefinition = {
                type: 'mcp-server',
                serverId: config.id,
                serverName: config.name
            };

            const execution = new vscode.ProcessExecution(
                config.command,
                config.args || [],
                {
                    cwd: config.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                    env: { ...process.env as Record<string, string>, ...(config.env || {}) }
                }
            );

            const task = new vscode.Task(
                taskDefinition,
                vscode.TaskScope.Workspace,
                config.name,
                'MCP',
                execution
            );

            // Execute task and track it
            const taskExecution = await vscode.tasks.executeTask(task);
            this.runningTasks.set(config.id, task);

            // Create server process record
            const serverProcess: ServerProcess = {
                id: config.id,
                task: task,
                startTime: new Date(),
                status: 'running'
            };
            this.serverProcesses.set(config.id, serverProcess);

            this.outputChannel.appendLine(`[INFO] Started MCP server: ${config.name} (${config.command})`);
            this.updateServerStatus(config.id, 'running');

            // Reset retry count on successful start
            this.resetRetryCount(config.id);

            // Monitor task completion
            this.monitorTaskExecution(taskExecution, config.id);

        } catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to start server ${config.name}: ${error}`);
            this.updateServerStatus(config.id, 'error');
            throw error;
        }
    }

    /**
     * Start server in terminal (alternative approach)
     */
    async startServerInTerminal(config: MCPServerConfig): Promise<void> {
        if (this.getServerStatus(config.id) === 'running') {
            return;
        }

        try {
            this.updateServerStatus(config.id, 'starting');

            const terminal = vscode.window.createTerminal({
                name: `MCP: ${config.name}`,
                cwd: config.cwd,
                env: config.env
            });

            terminal.sendText(`${config.command} ${config.args?.join(' ') || ''}`);
            this.terminals.set(config.id, terminal);

            // Create server process record
            const serverProcess: ServerProcess = {
                id: config.id,
                terminal: terminal,
                startTime: new Date(),
                status: 'running'
            };
            this.serverProcesses.set(config.id, serverProcess);

            this.outputChannel.appendLine(`[INFO] Started MCP server in terminal: ${config.name}`);
            this.updateServerStatus(config.id, 'running');

        } catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to start server in terminal ${config.name}: ${error}`);
            this.updateServerStatus(config.id, 'error');
            throw error;
        }
    }

    /**
     * Stop a server
     */
    async stopServer(serverId: string): Promise<void> {
        try {
            this.updateServerStatus(serverId, 'stopping');

            // Stop task-based server
            const task = this.runningTasks.get(serverId);
            if (task) {
                vscode.tasks.taskExecutions.forEach(execution => {
                    if (execution.task === task) {
                        execution.terminate();
                    }
                });
                this.runningTasks.delete(serverId);
            }

            // Stop terminal-based server
            const terminal = this.terminals.get(serverId);
            if (terminal) {
                terminal.dispose();
                this.terminals.delete(serverId);
            }

            // Remove server process record
            this.serverProcesses.delete(serverId);

            this.outputChannel.appendLine(`[INFO] Stopped MCP server: ${serverId}`);
            this.updateServerStatus(serverId, 'stopped');

        } catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to stop server ${serverId}: ${error}`);
            this.updateServerStatus(serverId, 'error');
            throw error;
        }
    }

    /**
     * Stop all running servers
     */
    async stopAllServers(): Promise<void> {
        const runningServers = Array.from(this.serverProcesses.keys());
        this.outputChannel.appendLine(`[INFO] Stopping ${runningServers.length} running servers`);

        for (const serverId of runningServers) {
            try {
                await this.stopServer(serverId);
            } catch (error) {
                this.outputChannel.appendLine(`[ERROR] Failed to stop server ${serverId}: ${error}`);
            }
        }
    }

    /**
     * Get server status
     */
    getServerStatus(serverId: string): ServerStatus {
        const process = this.serverProcesses.get(serverId);
        if (process) {
            return process.status;
        }

        if (this.runningTasks.has(serverId) || this.terminals.has(serverId)) {
            return 'running';
        }

        return 'stopped';
    }

    /**
     * Get all server processes
     */
    getAllServerProcesses(): Map<string, ServerProcess> {
        return new Map(this.serverProcesses);
    }

    /**
     * Monitor task execution
     */
    private monitorTaskExecution(taskExecution: vscode.TaskExecution, serverId: string): void {
        const disposable = vscode.tasks.onDidEndTask(e => {
            if (e.execution === taskExecution) {
                this.outputChannel.appendLine(`[INFO] Task ended for server: ${serverId}`);
                this.updateServerStatus(serverId, 'stopped');
                this.runningTasks.delete(serverId);
                this.serverProcesses.delete(serverId);
                disposable.dispose();
            }
        });
    }

    /**
     * Update server status
     */
    private updateServerStatus(serverId: string, status: ServerStatus): void {
        const process = this.serverProcesses.get(serverId);
        if (process) {
            process.status = status;
            this.serverProcesses.set(serverId, process);
        } else {
            // If no process record exists, create a minimal one for status tracking
            this.serverProcesses.set(serverId, {
                id: serverId,
                startTime: new Date(),
                status: status
            });
        }
    }

    /**
     * Start health monitoring for all servers
     */
    private startHealthMonitoring(): void {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, this.healthCheckIntervalMs);

        this.outputChannel.appendLine('[INFO] Started health monitoring for MCP servers');
    }

    /**
     * Stop health monitoring
     */
    private stopHealthMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
            this.outputChannel.appendLine('[INFO] Stopped health monitoring for MCP servers');
        }
    }

    /**
     * Perform health checks on all running servers
     */
    private async performHealthChecks(): Promise<void> {
        for (const [serverId, process] of this.serverProcesses.entries()) {
            if (process.status === 'running') {
                const isHealthy = await this.checkServerHealth(serverId, process);
                if (!isHealthy) {
                    this.outputChannel.appendLine(`[WARN] Server ${serverId} failed health check`);
                    await this.handleUnhealthyServer(serverId);
                }
            }
        }
    }

    /**
     * Check if a server is healthy
     */
    private async checkServerHealth(serverId: string, process: ServerProcess): Promise<boolean> {
        try {
            // For task-based servers, check if the task is still running
            if (process.task) {
                const isTaskRunning = vscode.tasks.taskExecutions.some(execution =>
                    execution.task === process.task
                );
                return isTaskRunning;
            }

            // For terminal-based servers, check if terminal is still active
            if (process.terminal) {
                return process.terminal.exitStatus === undefined;
            }

            // For HTTP/SSE servers, they're considered healthy if they're in our process map
            return true;
        } catch (error) {
            this.outputChannel.appendLine(`[ERROR] Health check failed for server ${serverId}: ${error}`);
            return false;
        }
    }

    /**
     * Handle an unhealthy server
     */
    private async handleUnhealthyServer(serverId: string): Promise<void> {
        const retryCount = this.retryAttempts.get(serverId) || 0;

        if (retryCount < this.maxRetryAttempts) {
            this.retryAttempts.set(serverId, retryCount + 1);
            this.outputChannel.appendLine(`[INFO] Attempting to restart server ${serverId} (attempt ${retryCount + 1}/${this.maxRetryAttempts})`);

            try {
                // Get the server config to restart it
                const process = this.serverProcesses.get(serverId);
                if (process) {
                    // Mark as stopped first
                    this.updateServerStatus(serverId, 'stopped');
                    this.serverProcesses.delete(serverId);
                    this.runningTasks.delete(serverId);

                    // Wait a bit before restarting
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // We need the config to restart - this would need to be passed from the extension
                    this.outputChannel.appendLine(`[INFO] Server ${serverId} marked for restart`);
                }
            } catch (error) {
                this.outputChannel.appendLine(`[ERROR] Failed to restart server ${serverId}: ${error}`);
                this.updateServerStatus(serverId, 'error');
            }
        } else {
            this.outputChannel.appendLine(`[ERROR] Server ${serverId} exceeded maximum retry attempts (${this.maxRetryAttempts})`);
            this.updateServerStatus(serverId, 'error');
            this.retryAttempts.delete(serverId);
        }
    }

    /**
     * Reset retry count for a server (call when manually started)
     */
    resetRetryCount(serverId: string): void {
        this.retryAttempts.delete(serverId);
    }

    /**
     * Get retry count for a server
     */
    getRetryCount(serverId: string): number {
        return this.retryAttempts.get(serverId) || 0;
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.stopHealthMonitoring();

        // Stop all servers synchronously for dispose
        const runningServers = Array.from(this.serverProcesses.keys());
        for (const serverId of runningServers) {
            try {
                // Update status to stopped immediately for dispose
                this.updateServerStatus(serverId, 'stopped');
            } catch (error) {
                this.outputChannel.appendLine(`[ERROR] Failed to stop server ${serverId}: ${error}`);
            }
        }

        this.runningTasks.clear();
        this.terminals.clear();
        this.serverProcesses.clear();
        this.retryAttempts.clear();
    }
}
