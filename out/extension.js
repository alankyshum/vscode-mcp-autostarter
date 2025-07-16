"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const mcpManager_1 = require("./mcpManager");
const mcpProvider_1 = require("./mcpProvider");
const mcpConfigManager_1 = require("./mcpConfigManager");
let serverManager;
let treeDataProvider;
let configManager;
let outputChannel;
function activate(context) {
    console.log('MCP Auto-Starter extension is now active!');
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('MCP Auto-Starter');
    outputChannel.appendLine('MCP Auto-Starter extension activated');
    // Initialize managers
    configManager = new mcpConfigManager_1.MCPConfigurationManager(outputChannel);
    serverManager = new mcpManager_1.MCPServerManager(outputChannel);
    treeDataProvider = new mcpProvider_1.MCPTreeDataProvider(serverManager, configManager);
    // Register tree view
    const treeView = vscode.window.createTreeView('mcpServers', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });
    // Register commands
    registerCommands(context);
    // Setup configuration watcher
    const configWatcher = configManager.setupConfigurationWatcher(() => {
        treeDataProvider.refresh();
    });
    // Auto-start servers if enabled
    autoStartServers();
    // Add disposables to context
    context.subscriptions.push(treeView, configWatcher, outputChannel, serverManager, ...getDisposables());
}
exports.activate = activate;
function registerCommands(context) {
    const commands = [
        vscode.commands.registerCommand('mcp-autostarter.toggleAutoStart', async (item) => {
            if (item && item.id) {
                await toggleAutoStart(item.id);
            }
        }),
        vscode.commands.registerCommand('mcp-autostarter.startServer', async (item) => {
            if (item && item.id) {
                await serverManager.startServer(item.config);
                treeDataProvider.refresh();
            }
        }),
        vscode.commands.registerCommand('mcp-autostarter.stopServer', async (item) => {
            if (item && item.id) {
                await serverManager.stopServer(item.id);
                treeDataProvider.refresh();
            }
        }),
        vscode.commands.registerCommand('mcp-autostarter.restartServer', async (item) => {
            if (item && item.id) {
                await serverManager.stopServer(item.id);
                setTimeout(async () => {
                    await serverManager.startServer(item.config);
                    treeDataProvider.refresh();
                }, 1000);
            }
        }),
        vscode.commands.registerCommand('mcp-autostarter.refreshView', () => {
            treeDataProvider.refresh();
        }),
        vscode.commands.registerCommand('mcp-autostarter.viewLogs', (item) => {
            if (item && item.id) {
                outputChannel.show();
            }
        })
    ];
    context.subscriptions.push(...commands);
}
async function toggleAutoStart(serverId) {
    try {
        const config = vscode.workspace.getConfiguration('mcp');
        const servers = config.get('servers') || {};
        if (servers[serverId]) {
            const currentAutoStart = servers[serverId].autoStart || false;
            servers[serverId].autoStart = !currentAutoStart;
            await config.update('servers', servers, vscode.ConfigurationTarget.Global);
            outputChannel.appendLine(`[INFO] Auto-start ${!currentAutoStart ? 'enabled' : 'disabled'} for server: ${serverId}`);
            treeDataProvider.refresh();
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to toggle auto-start: ${error}`);
        outputChannel.appendLine(`[ERROR] Failed to toggle auto-start: ${error}`);
    }
}
async function autoStartServers() {
    const globalAutoStart = vscode.workspace.getConfiguration('mcpAutoStarter').get('globalAutoStart', true);
    if (!globalAutoStart) {
        outputChannel.appendLine('[INFO] Global auto-start is disabled');
        return;
    }
    const servers = configManager.getMCPConfiguration();
    const autoStartServers = Object.entries(servers).filter(([_, config]) => config.autoStart === true && config.enabled !== false);
    outputChannel.appendLine(`[INFO] Auto-starting ${autoStartServers.length} servers`);
    for (const [id, config] of autoStartServers) {
        try {
            const serverConfig = {
                id,
                name: config.name || id,
                command: config.command,
                args: config.args,
                cwd: config.cwd,
                env: config.env,
                autoStart: true,
                enabled: true,
                type: config.type || 'stdio'
            };
            await serverManager.startServer(serverConfig);
            outputChannel.appendLine(`[INFO] Auto-started server: ${id}`);
        }
        catch (error) {
            outputChannel.appendLine(`[ERROR] Failed to auto-start server ${id}: ${error}`);
        }
    }
    // Refresh tree view after auto-start
    setTimeout(() => {
        treeDataProvider.refresh();
    }, 2000);
}
function getDisposables() {
    return [];
}
function deactivate() {
    outputChannel?.appendLine('MCP Auto-Starter extension deactivated');
    // Stop all running servers
    if (serverManager) {
        serverManager.stopAllServers();
    }
    // Dispose output channel
    if (outputChannel) {
        outputChannel.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map