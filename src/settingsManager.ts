import * as vscode from 'vscode';
import * as path from 'path';
import { MCPServerConfig } from './types/mcp';

export interface ExportedSettings {
    version: string;
    exportDate: string;
    globalAutoStart: boolean;
    servers: MCPServerConfig[];
    metadata: {
        extensionVersion: string;
        vscodeVersion: string;
        platform: string;
    };
}

export class SettingsManager {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Export current settings to a JSON file
     */
    async exportSettings(): Promise<void> {
        try {
            // Get current settings
            const mcpConfig = vscode.workspace.getConfiguration('mcp');
            const autoStarterConfig = vscode.workspace.getConfiguration('mcpAutoStarter');
            
            const servers = mcpConfig.get<Record<string, any>>('servers') || {};
            const globalAutoStart = autoStarterConfig.get<boolean>('globalAutoStart', true);

            // Convert servers object to array with IDs
            const serverArray: MCPServerConfig[] = Object.entries(servers).map(([id, config]) => ({
                id,
                name: config.name || id,
                type: config.type || 'stdio',
                command: config.command,
                args: config.args || [],
                url: config.url,
                cwd: config.cwd,
                env: config.env || {},
                autoStart: config.autoStart || false,
                enabled: config.enabled !== false
            }));

            const exportData: ExportedSettings = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                globalAutoStart,
                servers: serverArray,
                metadata: {
                    extensionVersion: vscode.extensions.getExtension('alankyshum.vscode-mcp-autostarter')?.packageJSON.version || 'unknown',
                    vscodeVersion: vscode.version,
                    platform: process.platform
                }
            };

            // Show save dialog
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 'mcp-settings.json')),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                },
                saveLabel: 'Export MCP Settings'
            });

            if (saveUri) {
                const jsonData = JSON.stringify(exportData, null, 2);
                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(jsonData, 'utf8'));
                
                vscode.window.showInformationMessage(`MCP settings exported to ${saveUri.fsPath}`);
                this.outputChannel.appendLine(`[INFO] Settings exported to ${saveUri.fsPath}`);
            }
        } catch (error) {
            const errorMessage = `Failed to export settings: ${error}`;
            vscode.window.showErrorMessage(errorMessage);
            this.outputChannel.appendLine(`[ERROR] ${errorMessage}`);
        }
    }

    /**
     * Import settings from a JSON file
     */
    async importSettings(): Promise<void> {
        try {
            // Show open dialog
            const openUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                },
                openLabel: 'Import MCP Settings'
            });

            if (!openUri || openUri.length === 0) {
                return;
            }

            const fileUri = openUri[0];
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            const jsonData = JSON.parse(fileData.toString());

            // Validate import data
            if (!this.validateImportData(jsonData)) {
                vscode.window.showErrorMessage('Invalid settings file format');
                return;
            }

            const importData = jsonData as ExportedSettings;

            // Show confirmation dialog
            const serverCount = importData.servers.length;
            const confirmMessage = `Import ${serverCount} server(s) from ${path.basename(fileUri.fsPath)}?\n\nThis will replace your current MCP server configurations.`;
            
            const result = await vscode.window.showWarningMessage(
                confirmMessage,
                { modal: true },
                'Import',
                'Merge'
            );

            if (!result) {
                return;
            }

            // Import settings
            await this.performImport(importData, result === 'Merge');
            
            vscode.window.showInformationMessage(`Successfully imported ${serverCount} server(s)`);
            this.outputChannel.appendLine(`[INFO] Settings imported from ${fileUri.fsPath}`);

        } catch (error) {
            const errorMessage = `Failed to import settings: ${error}`;
            vscode.window.showErrorMessage(errorMessage);
            this.outputChannel.appendLine(`[ERROR] ${errorMessage}`);
        }
    }

    /**
     * Validate imported data structure
     */
    private validateImportData(data: any): boolean {
        if (!data || typeof data !== 'object') {
            return false;
        }

        if (!data.version || !data.servers || !Array.isArray(data.servers)) {
            return false;
        }

        // Validate each server configuration
        for (const server of data.servers) {
            if (!server.id || !server.name) {
                return false;
            }
            
            // Must have either command or url
            if (!server.command && !server.url) {
                return false;
            }
        }

        return true;
    }

    /**
     * Perform the actual import operation
     */
    private async performImport(importData: ExportedSettings, merge: boolean): Promise<void> {
        const mcpConfig = vscode.workspace.getConfiguration('mcp');
        const autoStarterConfig = vscode.workspace.getConfiguration('mcpAutoStarter');

        // Import global auto-start setting
        await autoStarterConfig.update('globalAutoStart', importData.globalAutoStart, vscode.ConfigurationTarget.Global);

        // Import servers
        let existingServers: Record<string, any> = {};
        
        if (merge) {
            existingServers = mcpConfig.get<Record<string, any>>('servers') || {};
        }

        // Convert server array back to object format
        for (const server of importData.servers) {
            const { id, ...serverConfig } = server;
            existingServers[id] = serverConfig;
        }

        await mcpConfig.update('servers', existingServers, vscode.ConfigurationTarget.Global);
    }

    /**
     * Reset all settings to defaults
     */
    async resetSettings(): Promise<void> {
        const result = await vscode.window.showWarningMessage(
            'Are you sure you want to reset all MCP Auto-Starter settings to defaults?\n\nThis will remove all server configurations and cannot be undone.',
            { modal: true },
            'Reset'
        );

        if (result === 'Reset') {
            try {
                const mcpConfig = vscode.workspace.getConfiguration('mcp');
                const autoStarterConfig = vscode.workspace.getConfiguration('mcpAutoStarter');

                // Reset to defaults
                await mcpConfig.update('servers', {}, vscode.ConfigurationTarget.Global);
                await autoStarterConfig.update('globalAutoStart', true, vscode.ConfigurationTarget.Global);
                await autoStarterConfig.update('systemPrompt', '', vscode.ConfigurationTarget.Global);

                vscode.window.showInformationMessage('MCP Auto-Starter settings have been reset to defaults');
                this.outputChannel.appendLine('[INFO] Settings reset to defaults');
            } catch (error) {
                const errorMessage = `Failed to reset settings: ${error}`;
                vscode.window.showErrorMessage(errorMessage);
                this.outputChannel.appendLine(`[ERROR] ${errorMessage}`);
            }
        }
    }

    /**
     * Create a backup of current settings
     */
    async createBackup(): Promise<void> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `mcp-settings-backup-${timestamp}.json`;
            
            // Use workspace folder or home directory
            const defaultPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || require('os').homedir();
            
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(defaultPath, backupFileName)),
                filters: {
                    'JSON Files': ['json']
                },
                saveLabel: 'Create Backup'
            });

            if (saveUri) {
                // Use the export functionality to create backup
                await this.exportSettings();
            }
        } catch (error) {
            const errorMessage = `Failed to create backup: ${error}`;
            vscode.window.showErrorMessage(errorMessage);
            this.outputChannel.appendLine(`[ERROR] ${errorMessage}`);
        }
    }
}
