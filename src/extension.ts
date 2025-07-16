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
                try {
                    await serverManager.startServer(item.config);
                    vscode.window.showInformationMessage(`Started MCP server: ${item.name}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to start server ${item.name}: ${error}`);
                }
                treeDataProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('mcp-autostarter.stopServer', async (item: any) => {
            if (item && item.id) {
                try {
                    await serverManager.stopServer(item.id);
                    vscode.window.showInformationMessage(`Stopped MCP server: ${item.name}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to stop server ${item.name}: ${error}`);
                }
                treeDataProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('mcp-autostarter.restartServer', async (item: any) => {
            if (item && item.id) {
                try {
                    await serverManager.stopServer(item.id);
                    // Wait a bit before restarting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await serverManager.startServer(item.config);
                    vscode.window.showInformationMessage(`Restarted MCP server: ${item.name}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to restart server ${item.name}: ${error}`);
                }
                treeDataProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('mcp-autostarter.refreshView', () => {
            treeDataProvider.refresh();
            vscode.window.showInformationMessage('MCP servers view refreshed');
        }),

        vscode.commands.registerCommand('mcp-autostarter.viewLogs', (item: any) => {
            outputChannel.show();
            if (item && item.name) {
                outputChannel.appendLine(`[INFO] Showing logs for server: ${item.name}`);
            }
        }),

        vscode.commands.registerCommand('mcp-autostarter.showServerDetails', async (item: any) => {
            if (item && item.config) {
                await showServerDetails(item);
            }
        }),

        vscode.commands.registerCommand('mcp-autostarter.addServer', async () => {
            await addNewServer();
        }),

        vscode.commands.registerCommand('mcp-autostarter.editServer', async (item: any) => {
            if (item && item.id) {
                await editServer(item);
            }
        }),

        vscode.commands.registerCommand('mcp-autostarter.removeServer', async (item: any) => {
            if (item && item.id) {
                await removeServer(item);
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

async function showServerDetails(item: any) {
    const config = item.config;
    const status = serverManager.getServerStatus(item.id);

    const details = [
        `**${item.name}**`,
        '',
        `**Status:** ${status}`,
        `**Type:** ${config.type || 'stdio'}`,
        `**Auto-start:** ${config.autoStart ? 'Enabled' : 'Disabled'}`,
        `**Enabled:** ${config.enabled !== false ? 'Yes' : 'No'}`,
        '',
        config.command ? `**Command:** \`${config.command}\`` : '',
        config.args && config.args.length > 0 ? `**Arguments:** \`${config.args.join(' ')}\`` : '',
        config.url ? `**URL:** ${config.url}` : '',
        config.cwd ? `**Working Directory:** \`${config.cwd}\`` : '',
        config.env && Object.keys(config.env).length > 0 ? `**Environment Variables:** ${Object.keys(config.env).length} defined` : ''
    ].filter(Boolean).join('\n');

    const panel = vscode.window.createWebviewPanel(
        'mcpServerDetails',
        `MCP Server: ${item.name}`,
        vscode.ViewColumn.One,
        {}
    );

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MCP Server Details</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; }
                pre { background: var(--vscode-textBlockQuote-background); padding: 10px; border-radius: 4px; }
                .status-running { color: var(--vscode-testing-iconPassed); }
                .status-stopped { color: var(--vscode-testing-iconFailed); }
                .status-error { color: var(--vscode-testing-iconErrored); }
            </style>
        </head>
        <body>
            <div class="markdown-body">
                ${details.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\`(.*?)\`/g, '<code>$1</code>')
                        .replace(/\n/g, '<br>')}
            </div>
        </body>
        </html>
    `;
}

async function addNewServer() {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter server name',
        placeHolder: 'my-mcp-server'
    });

    if (!name) {
        return;
    }

    const command = await vscode.window.showInputBox({
        prompt: 'Enter server command',
        placeHolder: 'node server.js'
    });

    if (!command) {
        return;
    }

    try {
        const config = vscode.workspace.getConfiguration('mcp');
        const servers = config.get<Record<string, any>>('servers') || {};

        const serverId = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        servers[serverId] = {
            name: name,
            command: command,
            autoStart: false,
            enabled: true
        };

        await config.update('servers', servers, vscode.ConfigurationTarget.Global);
        treeDataProvider.refresh();
        vscode.window.showInformationMessage(`Added MCP server: ${name}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to add server: ${error}`);
    }
}

async function editServer(item: any) {
    vscode.window.showInformationMessage('Server editing will be implemented in a future version. For now, please edit the settings.json file directly.');
}

async function removeServer(item: any) {
    const result = await vscode.window.showWarningMessage(
        `Are you sure you want to remove the server "${item.name}"?`,
        { modal: true },
        'Remove'
    );

    if (result === 'Remove') {
        try {
            // Stop the server first if it's running
            if (serverManager.getServerStatus(item.id) === 'running') {
                await serverManager.stopServer(item.id);
            }

            const config = vscode.workspace.getConfiguration('mcp');
            const servers = config.get<Record<string, any>>('servers') || {};
            delete servers[item.id];

            await config.update('servers', servers, vscode.ConfigurationTarget.Global);
            treeDataProvider.refresh();
            vscode.window.showInformationMessage(`Removed MCP server: ${item.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to remove server: ${error}`);
        }
    }
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
