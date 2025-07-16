import * as vscode from 'vscode';
import { MCPServerManager } from './mcpManager';
import { MCPTreeDataProvider } from './mcpProvider';
import { MCPConfigurationManager } from './mcpConfigManager';

let serverManager: MCPServerManager;
let treeDataProvider: MCPTreeDataProvider;
let configManager: MCPConfigurationManager;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Auto-Starter extension is now active!');
    
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('MCP Auto-Starter');
    outputChannel.appendLine('MCP Auto-Starter extension activated');
    
    // Initialize managers
    configManager = new MCPConfigurationManager(outputChannel);
    serverManager = new MCPServerManager(outputChannel);
    treeDataProvider = new MCPTreeDataProvider(serverManager, configManager);
    
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
    context.subscriptions.push(
        treeView,
        configWatcher,
        outputChannel,
        serverManager,
        ...getDisposables()
    );
}

function registerCommands(context: vscode.ExtensionContext) {
    const commands = [
        vscode.commands.registerCommand('mcp-autostarter.toggleAutoStart', async (item: any) => {
            if (item && item.id) {
                await toggleAutoStart(item.id);
            }
        }),
        
        vscode.commands.registerCommand('mcp-autostarter.startServer', async (item: any) => {
            if (item && item.id) {
                await serverManager.startServer(item.config);
                treeDataProvider.refresh();
            }
        }),
        
        vscode.commands.registerCommand('mcp-autostarter.stopServer', async (item: any) => {
            if (item && item.id) {
                await serverManager.stopServer(item.id);
                treeDataProvider.refresh();
            }
        }),
        
        vscode.commands.registerCommand('mcp-autostarter.restartServer', async (item: any) => {
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
        
        vscode.commands.registerCommand('mcp-autostarter.viewLogs', (item: any) => {
            if (item && item.id) {
                outputChannel.show();
            }
        })
    ];
    
    context.subscriptions.push(...commands);
}

async function toggleAutoStart(serverId: string) {
    try {
        const config = vscode.workspace.getConfiguration('mcp');
        const servers = config.get<Record<string, any>>('servers') || {};
        
        if (servers[serverId]) {
            const currentAutoStart = servers[serverId].autoStart || false;
            servers[serverId].autoStart = !currentAutoStart;
            
            await config.update('servers', servers, vscode.ConfigurationTarget.Global);
            
            outputChannel.appendLine(`[INFO] Auto-start ${!currentAutoStart ? 'enabled' : 'disabled'} for server: ${serverId}`);
            treeDataProvider.refresh();
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to toggle auto-start: ${error}`);
        outputChannel.appendLine(`[ERROR] Failed to toggle auto-start: ${error}`);
    }
}

async function autoStartServers() {
    const globalAutoStart = vscode.workspace.getConfiguration('mcpAutoStarter').get<boolean>('globalAutoStart', true);
    
    if (!globalAutoStart) {
        outputChannel.appendLine('[INFO] Global auto-start is disabled');
        return;
    }
    
    const servers = configManager.getMCPConfiguration();
    const autoStartServers = Object.entries(servers).filter(([_, config]) => 
        config.autoStart === true && config.enabled !== false
    );
    
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
        } catch (error) {
            outputChannel.appendLine(`[ERROR] Failed to auto-start server ${id}: ${error}`);
        }
    }
    
    // Refresh tree view after auto-start
    setTimeout(() => {
        treeDataProvider.refresh();
    }, 2000);
}

function getDisposables(): vscode.Disposable[] {
    return [];
}

export function deactivate() {
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
