import * as vscode from 'vscode';
import { MCPServerManager } from './mcpManager';
import { MCPConfigurationManager } from './mcpConfigManager';
import { MCPServerItem, MCPServerConfig } from './types/mcp';

export class MCPTreeDataProvider implements vscode.TreeDataProvider<MCPServerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MCPServerItem | undefined | null | void> = new vscode.EventEmitter<MCPServerItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MCPServerItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private serverManager: MCPServerManager,
        private configManager: MCPConfigurationManager
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MCPServerItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None);
        item.contextValue = 'mcpServer';

        // Create detailed tooltip with server information
        const autoStartText = element.autoStart ? 'ON' : 'OFF';
        const statusText = element.status.toUpperCase();
        const serverType = element.config.type || 'stdio';
        const command = element.config.command || element.config.url || 'N/A';

        item.tooltip = new vscode.MarkdownString([
            `**${element.name}**`,
            `Type: ${serverType}`,
            `Command: \`${command}\``,
            `Auto-start: ${autoStartText}`,
            `Status: ${statusText}`,
            element.config.cwd ? `Working Directory: \`${element.config.cwd}\`` : ''
        ].filter(Boolean).join('\n\n'));

        // Set description to show auto-start and status
        item.description = `[Auto: ${autoStartText}] ${this.getStatusIcon(element.status)} ${statusText}`;

        // Status icons with theme colors
        switch (element.status) {
            case 'running':
                item.iconPath = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
                break;
            case 'stopped':
                item.iconPath = new vscode.ThemeIcon('stop-circle', new vscode.ThemeColor('testing.iconFailed'));
                break;
            case 'error':
                item.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconErrored'));
                break;
            case 'starting':
                item.iconPath = new vscode.ThemeIcon('loading~spin', new vscode.ThemeColor('testing.iconQueued'));
                break;
            case 'stopping':
                item.iconPath = new vscode.ThemeIcon('loading~spin', new vscode.ThemeColor('testing.iconQueued'));
                break;
            default:
                item.iconPath = new vscode.ThemeIcon('circle-outline');
        }

        // Add command for double-click to show server details
        item.command = {
            command: 'mcp-autostarter.showServerDetails',
            title: 'Show Server Details',
            arguments: [element]
        };

        return item;
    }

    getChildren(element?: MCPServerItem): Thenable<MCPServerItem[]> {
        if (!element) {
            // Root level - return all servers
            return Promise.resolve(this.getMCPServers());
        }
        return Promise.resolve([]);
    }

    private getMCPServers(): MCPServerItem[] {
        try {
            const servers = this.configManager.getAllServerConfigs();
            
            return servers.map(config => ({
                id: config.id,
                name: config.name,
                status: this.serverManager.getServerStatus(config.id),
                autoStart: config.autoStart,
                config: config
            }));
        } catch (error) {
            console.error('Failed to get MCP servers:', error);
            return [];
        }
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'running':
                return '●';
            case 'stopped':
                return '○';
            case 'error':
                return '⚠';
            case 'starting':
                return '⟳';
            case 'stopping':
                return '⟳';
            default:
                return '○';
        }
    }

    /**
     * Get server item by ID
     */
    getServerItem(serverId: string): MCPServerItem | undefined {
        const servers = this.getMCPServers();
        return servers.find(server => server.id === serverId);
    }

    /**
     * Get all server items
     */
    getAllServerItems(): MCPServerItem[] {
        return this.getMCPServers();
    }
}
