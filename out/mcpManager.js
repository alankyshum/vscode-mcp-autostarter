"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerManager = void 0;
const vscode = require("vscode");
class MCPServerManager {
    constructor(outputChannel) {
        this.runningTasks = new Map();
        this.terminals = new Map();
        this.serverProcesses = new Map();
        this.retryAttempts = new Map();
        this.maxRetryAttempts = 3;
        this.healthCheckIntervalMs = 30000; // 30 seconds
        this.outputChannel = outputChannel;
        this.startHealthMonitoring();
    }
    /**
     * Start a server using VSCode Task API
     */
    async startServer(config) {
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
            const taskDefinition = {
                type: 'mcp-server',
                serverId: config.id,
                serverName: config.name
            };
            const execution = new vscode.ProcessExecution(config.command, config.args || [], {
                cwd: config.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                env: { ...process.env, ...(config.env || {}) }
            });
            const task = new vscode.Task(taskDefinition, vscode.TaskScope.Workspace, config.name, 'MCP', execution);
            // Execute task and track it
            const taskExecution = await vscode.tasks.executeTask(task);
            this.runningTasks.set(config.id, task);
            // Create server process record
            const serverProcess = {
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
        }
        catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to start server ${config.name}: ${error}`);
            this.updateServerStatus(config.id, 'error');
            throw error;
        }
    }
    /**
     * Start server in terminal (alternative approach)
     */
    async startServerInTerminal(config) {
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
            const serverProcess = {
                id: config.id,
                terminal: terminal,
                startTime: new Date(),
                status: 'running'
            };
            this.serverProcesses.set(config.id, serverProcess);
            this.outputChannel.appendLine(`[INFO] Started MCP server in terminal: ${config.name}`);
            this.updateServerStatus(config.id, 'running');
        }
        catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to start server in terminal ${config.name}: ${error}`);
            this.updateServerStatus(config.id, 'error');
            throw error;
        }
    }
    /**
     * Stop a server
     */
    async stopServer(serverId) {
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
        }
        catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to stop server ${serverId}: ${error}`);
            this.updateServerStatus(serverId, 'error');
            throw error;
        }
    }
    /**
     * Stop all running servers
     */
    async stopAllServers() {
        const runningServers = Array.from(this.serverProcesses.keys());
        this.outputChannel.appendLine(`[INFO] Stopping ${runningServers.length} running servers`);
        for (const serverId of runningServers) {
            try {
                await this.stopServer(serverId);
            }
            catch (error) {
                this.outputChannel.appendLine(`[ERROR] Failed to stop server ${serverId}: ${error}`);
            }
        }
    }
    /**
     * Get server status
     */
    getServerStatus(serverId) {
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
    getAllServerProcesses() {
        return new Map(this.serverProcesses);
    }
    /**
     * Monitor task execution
     */
    monitorTaskExecution(taskExecution, serverId) {
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
    updateServerStatus(serverId, status) {
        const process = this.serverProcesses.get(serverId);
        if (process) {
            process.status = status;
            this.serverProcesses.set(serverId, process);
        }
    }
    /**
     * Start health monitoring for all servers
     */
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, this.healthCheckIntervalMs);
        this.outputChannel.appendLine('[INFO] Started health monitoring for MCP servers');
    }
    /**
     * Stop health monitoring
     */
    stopHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
            this.outputChannel.appendLine('[INFO] Stopped health monitoring for MCP servers');
        }
    }
    /**
     * Perform health checks on all running servers
     */
    async performHealthChecks() {
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
    async checkServerHealth(serverId, process) {
        try {
            // For task-based servers, check if the task is still running
            if (process.task) {
                const isTaskRunning = vscode.tasks.taskExecutions.some(execution => execution.task === process.task);
                return isTaskRunning;
            }
            // For terminal-based servers, check if terminal is still active
            if (process.terminal) {
                return process.terminal.exitStatus === undefined;
            }
            // For HTTP/SSE servers, they're considered healthy if they're in our process map
            return true;
        }
        catch (error) {
            this.outputChannel.appendLine(`[ERROR] Health check failed for server ${serverId}: ${error}`);
            return false;
        }
    }
    /**
     * Handle an unhealthy server
     */
    async handleUnhealthyServer(serverId) {
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
            }
            catch (error) {
                this.outputChannel.appendLine(`[ERROR] Failed to restart server ${serverId}: ${error}`);
                this.updateServerStatus(serverId, 'error');
            }
        }
        else {
            this.outputChannel.appendLine(`[ERROR] Server ${serverId} exceeded maximum retry attempts (${this.maxRetryAttempts})`);
            this.updateServerStatus(serverId, 'error');
            this.retryAttempts.delete(serverId);
        }
    }
    /**
     * Reset retry count for a server (call when manually started)
     */
    resetRetryCount(serverId) {
        this.retryAttempts.delete(serverId);
    }
    /**
     * Get retry count for a server
     */
    getRetryCount(serverId) {
        return this.retryAttempts.get(serverId) || 0;
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        this.stopHealthMonitoring();
        this.stopAllServers();
        this.runningTasks.clear();
        this.terminals.clear();
        this.serverProcesses.clear();
        this.retryAttempts.clear();
    }
}
exports.MCPServerManager = MCPServerManager;
//# sourceMappingURL=mcpManager.js.map