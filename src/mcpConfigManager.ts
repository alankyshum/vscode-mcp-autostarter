import * as vscode from 'vscode';
import { MCPServerConfig } from './types/mcp';

export class MCPConfigurationManager {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Get MCP configuration from VSCode settings
     */
    getMCPConfiguration(): Record<string, any> {
        try {
            const config = vscode.workspace.getConfiguration('mcp');
            const servers = config.get<Record<string, any>>('servers') || {};

            // Filter out internal VSCode settings (e.g., mcp-server-time)
            const userServers = Object.fromEntries(
                Object.entries(servers).filter(([key]) => !key.includes('-internal'))
            );

            this.outputChannel.appendLine(`[INFO] Found ${Object.keys(userServers).length} MCP servers in configuration`);
            return userServers;
        } catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to read MCP config: ${error}`);
            return {};
        }
    }

    /**
     * Get workspace-specific MCP configuration
     */
    async getWorkspaceMCPConfig(): Promise<Record<string, any>> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return {};
        }

        const mcpConfigPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'mcp.json');

        try {
            const configData = await vscode.workspace.fs.readFile(mcpConfigPath);
            const config = JSON.parse(configData.toString());
            this.outputChannel.appendLine(`[INFO] Loaded workspace MCP config from ${mcpConfigPath.fsPath}`);
            return config.servers || {};
        } catch (error) {
            // File doesn't exist or is invalid - this is normal
            this.outputChannel.appendLine(`[DEBUG] No workspace MCP config found at ${mcpConfigPath.fsPath}`);
            return {};
        }
    }

    /**
     * Setup configuration change watcher
     */
    setupConfigurationWatcher(onConfigChanged: () => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('mcp') || event.affectsConfiguration('mcpAutoStarter')) {
                this.outputChannel.appendLine('[INFO] MCP configuration changed');
                onConfigChanged();
            }
        });
    }

    /**
     * Validate server configuration
     */
    validateServerConfig(config: any): MCPServerConfig | null {
        try {
            // Basic validation
            if (!config.command && !config.url) {
                this.outputChannel.appendLine('[WARN] Server config missing command or url');
                return null;
            }

            return {
                id: config.id || 'unknown',
                name: config.name || config.id || 'Unknown Server',
                type: config.type || 'stdio',
                command: config.command,
                args: config.args || [],
                url: config.url,
                cwd: config.cwd,
                env: config.env || {},
                autoStart: config.autoStart || false,
                enabled: config.enabled !== false
            };
        } catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to validate server config: ${error}`);
            return null;
        }
    }

    /**
     * Get all valid server configurations
     */
    getAllServerConfigs(): MCPServerConfig[] {
        const globalServers = this.getMCPConfiguration();
        const configs: MCPServerConfig[] = [];

        for (const [id, config] of Object.entries(globalServers)) {
            const validConfig = this.validateServerConfig({ ...config, id });
            if (validConfig) {
                configs.push(validConfig);
            }
        }

        return configs;
    }

    /**
     * Update server configuration
     */
    async updateServerConfig(serverId: string, updates: Partial<MCPServerConfig>): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('mcp');
            const servers = config.get<Record<string, any>>('servers') || {};

            if (servers[serverId]) {
                servers[serverId] = { ...servers[serverId], ...updates };
                await config.update('servers', servers, vscode.ConfigurationTarget.Global);
                this.outputChannel.appendLine(`[INFO] Updated configuration for server: ${serverId}`);
            } else {
                this.outputChannel.appendLine(`[WARN] Server ${serverId} not found in configuration`);
            }
        } catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to update server config: ${error}`);
            throw error;
        }
    }
}
