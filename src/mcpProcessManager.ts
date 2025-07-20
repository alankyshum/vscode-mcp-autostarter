import * as vscode from 'vscode';
import * as cp from 'child_process';
import { MCPServerConfig } from './mcpConfigReader';

export interface RunningServer {
    name: string;
    config: MCPServerConfig;
    process: cp.ChildProcess;
    outputChannel: vscode.OutputChannel;
    startTime: Date;
    status: 'starting' | 'running' | 'stopped' | 'error';
}

export class MCPProcessManager {
    private outputChannel: vscode.OutputChannel;
    private runningServers: Map<string, RunningServer> = new Map();

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Start an MCP server process
     */
    public async startServer(serverName: string, config: MCPServerConfig): Promise<boolean> {
        try {
            // Check if server is already running
            if (this.runningServers.has(serverName)) {
                return true;
            }

            // Create dedicated output channel for this server
            const serverOutputChannel = vscode.window.createOutputChannel(`MCP Server: ${serverName}`);

            // Prepare spawn options
            const spawnOptions: cp.SpawnOptions = {
                cwd: config.cwd || process.cwd(),
                env: { ...process.env, ...config.env },
                stdio: ['pipe', 'pipe', 'pipe']
            };

            // Start the process
            const childProcess = cp.spawn(config.command, config.args || [], spawnOptions);

            const runningServer: RunningServer = {
                name: serverName,
                config,
                process: childProcess,
                outputChannel: serverOutputChannel,
                startTime: new Date(),
                status: 'starting'
            };

            this.runningServers.set(serverName, runningServer);

            // Handle process events
            childProcess.on('spawn', () => {
                runningServer.status = 'running';
                this.outputChannel.appendLine(`✅ ${serverName} started (PID: ${childProcess.pid})`);
                serverOutputChannel.appendLine(`Started at ${runningServer.startTime.toISOString()}`);
                serverOutputChannel.appendLine(`Command: ${config.command} ${(config.args || []).join(' ')}`);
                serverOutputChannel.appendLine('--- Output ---');
            });

            childProcess.on('error', (error) => {
                runningServer.status = 'error';
                this.outputChannel.appendLine(`❌ ${serverName} failed: ${error.message}`);
                this.runningServers.delete(serverName);
            });

            childProcess.on('exit', (code, signal) => {
                runningServer.status = 'stopped';
                const exitMessage = signal ? `killed by signal ${signal}` : `exited with code ${code}`;
                this.outputChannel.appendLine(`🔴 ${serverName} ${exitMessage}`);
                this.runningServers.delete(serverName);
            });

            // Pipe stdout and stderr to the output channel
            if (childProcess.stdout) {
                childProcess.stdout.on('data', (data) => {
                    serverOutputChannel.append(data.toString());
                });
            }

            if (childProcess.stderr) {
                childProcess.stderr.on('data', (data) => {
                    serverOutputChannel.append(`[STDERR] ${data.toString()}`);
                });
            }

            // Give the process a moment to start
            await new Promise(resolve => setTimeout(resolve, 1000));

            return runningServer.status === 'running';

        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to start ${serverName}: ${error}`);
            return false;
        }
    }

    /**
     * Stop an MCP server process
     */
    public async stopServer(serverName: string): Promise<boolean> {
        const runningServer = this.runningServers.get(serverName);
        
        if (!runningServer) {
            this.outputChannel.appendLine(`Server ${serverName} is not running`);
            return true;
        }

        try {
            this.outputChannel.appendLine(`Stopping MCP server: ${serverName}`);
            
            // Try graceful shutdown first
            runningServer.process.kill('SIGTERM');
            
            // Wait a bit for graceful shutdown
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Force kill if still running
            if (!runningServer.process.killed) {
                runningServer.process.kill('SIGKILL');
            }

            this.runningServers.delete(serverName);
            runningServer.outputChannel.dispose();
            
            this.outputChannel.appendLine(`✅ Server ${serverName} stopped`);
            return true;

        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to stop server ${serverName}: ${error}`);
            return false;
        }
    }

    /**
     * Get the status of a server
     */
    public getServerStatus(serverName: string): 'running' | 'stopped' {
        const runningServer = this.runningServers.get(serverName);
        return runningServer ? runningServer.status === 'running' ? 'running' : 'stopped' : 'stopped';
    }

    /**
     * Get all running servers
     */
    public getRunningServers(): string[] {
        return Array.from(this.runningServers.keys());
    }

    /**
     * Get detailed info about a running server
     */
    public getServerInfo(serverName: string): RunningServer | undefined {
        return this.runningServers.get(serverName);
    }

    /**
     * Stop all running servers
     */
    public async stopAllServers(): Promise<void> {
        this.outputChannel.appendLine('Stopping all MCP servers...');
        
        const stopPromises = Array.from(this.runningServers.keys()).map(serverName => 
            this.stopServer(serverName)
        );
        
        await Promise.all(stopPromises);
        this.outputChannel.appendLine('All MCP servers stopped');
    }

    /**
     * Check if a server is running
     */
    public isServerRunning(serverName: string): boolean {
        const runningServer = this.runningServers.get(serverName);
        return runningServer?.status === 'running' || false;
    }

    /**
     * Restart a server
     */
    public async restartServer(serverName: string, config: MCPServerConfig): Promise<boolean> {
        this.outputChannel.appendLine(`Restarting MCP server: ${serverName}`);
        
        await this.stopServer(serverName);
        
        // Wait a moment before restarting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return await this.startServer(serverName, config);
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.stopAllServers();
    }
}
