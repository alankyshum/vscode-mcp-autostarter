import * as vscode from 'vscode';
import { MCPConfigurationReader } from './mcpConfigReader';
import { MCPProcessManager } from './mcpProcessManager';

let outputChannel: vscode.OutputChannel;
let configReader: MCPConfigurationReader;
let processManager: MCPProcessManager;
let configWatcher: vscode.Disposable | undefined;

export async function activate(context: vscode.ExtensionContext) {
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('MCP Auto-Starter');
    outputChannel.appendLine('MCP Auto-Starter activated');

    // Initialize managers
    configReader = new MCPConfigurationReader(outputChannel, context);
    processManager = new MCPProcessManager(outputChannel);

    // Register the enable auto-start command
    const enableAutoStartCommand = vscode.commands.registerCommand(
        'mcp-autostarter.enableAutoStart',
        enableAutoStartForRunningServers
    );

    context.subscriptions.push(enableAutoStartCommand);
    context.subscriptions.push(outputChannel);

    // Start auto-start servers on activation
    await startAutoStartServers();

    // Watch for configuration changes
    configWatcher = configReader.watchConfiguration(async (config) => {
        if (config) {
            await startAutoStartServers();
        }
    });

    context.subscriptions.push(configWatcher);
    context.subscriptions.push(new vscode.Disposable(() => {
        processManager.dispose();
    }));
}

async function startAutoStartServers(): Promise<void> {
    try {
        if (!configReader.configExists()) {
            return;
        }

        const autoStartServers = await configReader.getAutoStartServers();

        if (Object.keys(autoStartServers).length === 0) {
            return;
        }

        let startedCount = 0;
        let failedCount = 0;

        for (const [serverName, serverConfig] of Object.entries(autoStartServers)) {
            // Validate configuration
            if (!configReader.validateServerConfig(serverName, serverConfig)) {
                failedCount++;
                continue;
            }

            // Only start stdio servers
            if (serverConfig.type !== 'stdio') {
                continue;
            }

            // Check if already running
            if (processManager.isServerRunning(serverName)) {
                continue;
            }

            // Start the server
            const success = await processManager.startServer(serverName, serverConfig);
            if (success) {
                startedCount++;
            } else {
                failedCount++;
            }
        }

        if (startedCount > 0) {
            vscode.window.showInformationMessage(`MCP Auto-Starter: Started ${startedCount} server(s)`);
        }

        if (failedCount > 0) {
            vscode.window.showWarningMessage(`MCP Auto-Starter: ${failedCount} server(s) failed to start`);
        }

    } catch (error) {
        vscode.window.showErrorMessage(`MCP Auto-Starter failed: ${error}`);
    }
}

async function enableAutoStartForRunningServers(): Promise<void> {
    try {
        outputChannel.appendLine('Enabling auto-start for currently running MCP servers...');

        // This is a placeholder implementation
        // In a real implementation, we would need to:
        // 1. Query the existing MCP extension for running servers
        // 2. Update the mcp.json configuration to add autoStart: true
        // 3. This requires integration with the main MCP extension

        vscode.window.showInformationMessage(
            'This feature requires integration with the main MCP extension and is not yet implemented. ' +
            'Please manually add "autoStart": true to your server configurations in mcp.json.'
        );

        // Show the user how to manually enable auto-start
        const openConfig = await vscode.window.showInformationMessage(
            'Would you like to open the MCP configuration file to manually enable auto-start?',
            'Open Configuration'
        );

        if (openConfig === 'Open Configuration') {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'mcp');
        }

    } catch (error) {
        const errorMessage = `Failed to enable auto-start: ${error}`;
        outputChannel.appendLine(errorMessage);
        vscode.window.showErrorMessage(errorMessage);
    }
}

export function deactivate() {
    console.log('MCP Auto-Starter extension is being deactivated');

    if (outputChannel) {
        outputChannel.appendLine('MCP Auto-Starter extension deactivated');
    }

    if (processManager) {
        processManager.dispose();
    }

    if (configWatcher) {
        configWatcher.dispose();
    }
}
