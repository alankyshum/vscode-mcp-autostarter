import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface MCPServerConfig {
    type: string;
    command: string;
    args?: string[];
    gallery?: boolean;
    autoStart?: boolean;
    cwd?: string;
    env?: Record<string, string>;
}

export interface MCPConfiguration {
    servers: Record<string, MCPServerConfig>;
}

export class MCPConfigurationReader {
    private outputChannel: vscode.OutputChannel;
    private context: vscode.ExtensionContext;

    constructor(outputChannel: vscode.OutputChannel, context: vscode.ExtensionContext) {
        this.outputChannel = outputChannel;
        this.context = context;
    }

    /**
     * Get the path to the MCP configuration file using VSCode APIs
     */
    private getMCPConfigPath(): string {
        // Check for user-configured custom path first
        const customPath = vscode.workspace.getConfiguration('mcpAutoStarter').get<string>('configPath');
        if (customPath) {
            this.outputChannel.appendLine(`Using custom MCP config path: ${customPath}`);
            return customPath;
        }

        // Use VSCode's API to determine the user configuration directory
        return this.getVSCodeUserConfigPath();
    }

    /**
     * Get the VSCode user configuration directory using VSCode APIs
     */
    private getVSCodeUserConfigPath(): string {
        const globalStorageUri = this.context.globalStorageUri;

        if (globalStorageUri.scheme === 'file') {
            const userConfigPath = this.deriveUserConfigFromGlobalStorage(globalStorageUri.fsPath);
            if (userConfigPath) {
                this.outputChannel.appendLine(`Found MCP config path: ${userConfigPath}`);
                return userConfigPath;
            }
        }

        // Fallback to trying multiple possible paths
        return this.getLocalMCPConfigPath();
    }

    /**
     * Derive the VSCode user config directory from the global storage path
     */
    private deriveUserConfigFromGlobalStorage(globalStoragePath: string): string | null {
        try {
            const pathParts = globalStoragePath.split(path.sep);

            // Find the VSCode-related directory in the path
            let vscodeIndex = -1;
            for (let i = pathParts.length - 1; i >= 0; i--) {
                if (pathParts[i].includes('vscode') || pathParts[i].includes('Code')) {
                    vscodeIndex = i;
                    break;
                }
            }

            if (vscodeIndex >= 0) {
                const vscodeDir = pathParts.slice(0, vscodeIndex + 1).join(path.sep);
                const userDir = path.join(vscodeDir, 'User');
                if (fs.existsSync(userDir)) {
                    return path.join(userDir, 'mcp.json');
                }
            }
        } catch (error) {
            // Silent fallback
        }

        return null;
    }

    /**
     * Get the MCP configuration path on the user's local machine
     */
    private getLocalMCPConfigPath(): string {
        const possiblePaths = this.getPossibleMCPConfigPaths();

        // Try to find an existing config file
        for (const configPath of possiblePaths) {
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }

        // If no existing config found, use the default path
        return this.getDefaultMCPConfigPath();
    }

    /**
     * Get all possible MCP configuration paths across different platforms
     */
    private getPossibleMCPConfigPaths(): string[] {
        const homeDir = os.homedir();

        return [
            // macOS
            path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'mcp.json'),
            // Windows
            path.join(homeDir, 'AppData', 'Roaming', 'Code', 'User', 'mcp.json'),
            // Linux
            path.join(homeDir, '.config', 'Code', 'User', 'mcp.json'),
            // VSCode Insiders variants
            path.join(homeDir, 'Library', 'Application Support', 'Code - Insiders', 'User', 'mcp.json'),
            path.join(homeDir, 'AppData', 'Roaming', 'Code - Insiders', 'User', 'mcp.json'),
            path.join(homeDir, '.config', 'Code - Insiders', 'User', 'mcp.json'),
        ];
    }

    /**
     * Get the default MCP configuration path based on current platform
     */
    private getDefaultMCPConfigPath(): string {
        const homeDir = os.homedir();
        const platform = os.platform();

        if (platform === 'darwin') {
            // macOS
            return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'mcp.json');
        } else if (platform === 'win32') {
            // Windows
            return path.join(homeDir, 'AppData', 'Roaming', 'Code', 'User', 'mcp.json');
        } else {
            // Linux and others
            return path.join(homeDir, '.config', 'Code', 'User', 'mcp.json');
        }
    }

    /**
     * Check if MCP configuration file exists
     */
    public configExists(): boolean {
        const configPath = this.getMCPConfigPath();
        return fs.existsSync(configPath);
    }

    /**
     * Read and parse the MCP configuration file
     */
    public async readConfiguration(): Promise<MCPConfiguration | null> {
        const configPath = this.getMCPConfigPath();

        try {
            if (!fs.existsSync(configPath)) {
                this.outputChannel.appendLine(`MCP configuration file not found at: ${configPath}`);
                return null;
            }

            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent) as MCPConfiguration;

            this.outputChannel.appendLine(`Successfully read MCP configuration from: ${configPath}`);
            this.outputChannel.appendLine(`Found ${Object.keys(config.servers || {}).length} server(s) configured`);

            return config;
        } catch (error) {
            this.outputChannel.appendLine(`Error reading MCP configuration: ${error}`);
            vscode.window.showErrorMessage(`Failed to read MCP configuration: ${error}`);
            return null;
        }
    }

    /**
     * Get servers that have autoStart enabled
     */
    public async getAutoStartServers(): Promise<Record<string, MCPServerConfig>> {
        const config = await this.readConfiguration();
        if (!config || !config.servers) {
            return {};
        }

        const autoStartServers: Record<string, MCPServerConfig> = {};

        for (const [serverName, serverConfig] of Object.entries(config.servers)) {
            if (serverConfig.autoStart === true) {
                autoStartServers[serverName] = serverConfig;
                this.outputChannel.appendLine(`Found auto-start server: ${serverName}`);
            }
        }

        this.outputChannel.appendLine(`Found ${Object.keys(autoStartServers).length} server(s) with auto-start enabled`);
        return autoStartServers;
    }

    /**
     * Watch for changes to the MCP configuration file
     */
    public watchConfiguration(callback: (config: MCPConfiguration | null) => void): vscode.Disposable {
        const configPath = this.getMCPConfigPath();

        if (!fs.existsSync(configPath)) {
            this.outputChannel.appendLine(`MCP configuration file not found at: ${configPath}`);
            this.outputChannel.appendLine('Will check for configuration file creation...');

            // Watch the parent directory for file creation
            const configDir = path.dirname(configPath);
            const configFileName = path.basename(configPath);

            if (!fs.existsSync(configDir)) {
                this.outputChannel.appendLine(`Configuration directory does not exist: ${configDir}`);
                return new vscode.Disposable(() => {});
            }

            // Watch for file creation in the config directory
            const dirWatcher = fs.watch(configDir, (eventType, filename) => {
                if (eventType === 'rename' && filename === configFileName) {
                    if (fs.existsSync(configPath)) {
                        this.outputChannel.appendLine('MCP configuration file created, starting to watch...');
                        // File was created, start watching it
                        dirWatcher.close();
                        // Recursively call to start watching the actual file
                        const fileWatcher = this.watchConfiguration(callback);
                        // Call callback with the new config
                        this.readConfiguration().then(callback);
                        return fileWatcher;
                    }
                }
            });

            return new vscode.Disposable(() => {
                dirWatcher.close();
            });
        }

        // File exists, watch it for changes
        this.outputChannel.appendLine(`Watching MCP configuration file: ${configPath}`);
        const watcher = fs.watchFile(configPath, { interval: 1000 }, async () => {
            this.outputChannel.appendLine('MCP configuration file changed, reloading...');
            const config = await this.readConfiguration();
            callback(config);
        });

        return new vscode.Disposable(() => {
            fs.unwatchFile(configPath);
        });
    }

    /**
     * Validate server configuration
     */
    public validateServerConfig(serverName: string, config: MCPServerConfig): boolean {
        if (!config.command) {
            this.outputChannel.appendLine(`Server ${serverName} is missing required 'command' field`);
            return false;
        }

        if (!config.type) {
            this.outputChannel.appendLine(`Server ${serverName} is missing required 'type' field`);
            return false;
        }

        if (!['stdio', 'http', 'sse'].includes(config.type)) {
            this.outputChannel.appendLine(`Server ${serverName} has invalid type '${config.type}'. Must be 'stdio', 'http', or 'sse'`);
            return false;
        }

        return true;
    }
}
