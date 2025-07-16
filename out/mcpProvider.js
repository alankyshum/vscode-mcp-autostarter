"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPTreeDataProvider = void 0;
const vscode = require("vscode");
class MCPTreeDataProvider {
    constructor(serverManager, configManager) {
        this.serverManager = serverManager;
        this.configManager = configManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None);
        item.contextValue = 'mcpServer';
        // Create tooltip with server information
        const autoStartText = element.autoStart ? 'ON' : 'OFF';
        const statusText = element.status.toUpperCase();
        item.tooltip = `${element.name}\nAuto-start: ${autoStartText}\nStatus: ${statusText}`;
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
        // Store the full item data for command handlers
        item.command = undefined; // No default command on click
        return item;
    }
    getChildren(element) {
        if (!element) {
            // Root level - return all servers
            return Promise.resolve(this.getMCPServers());
        }
        return Promise.resolve([]);
    }
    getMCPServers() {
        try {
            const servers = this.configManager.getAllServerConfigs();
            return servers.map(config => ({
                id: config.id,
                name: config.name,
                status: this.serverManager.getServerStatus(config.id),
                autoStart: config.autoStart,
                config: config
            }));
        }
        catch (error) {
            console.error('Failed to get MCP servers:', error);
            return [];
        }
    }
    getStatusIcon(status) {
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
    getServerItem(serverId) {
        const servers = this.getMCPServers();
        return servers.find(server => server.id === serverId);
    }
    /**
     * Get all server items
     */
    getAllServerItems() {
        return this.getMCPServers();
    }
}
exports.MCPTreeDataProvider = MCPTreeDataProvider;
//# sourceMappingURL=mcpProvider.js.map