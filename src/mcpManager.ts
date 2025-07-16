import * as vscode from 'vscode';
import { MCPServerConfig, ServerStatus, ServerProcess } from './types/mcp';

export class MCPServerManager implements vscode.Disposable {
    private runningTasks: Map<string, vscode.Task> = new Map();
    private terminals: Map<string, vscode.Terminal> = new Map();
    private serverProcesses: Map<string, ServerProcess> = new Map();
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
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
        }
    }

    /**
     * Dispose of all resources
     */
    dispose(): void {
        this.stopAllServers();
        this.runningTasks.clear();
        this.terminals.clear();
        this.serverProcesses.clear();
    }
}
