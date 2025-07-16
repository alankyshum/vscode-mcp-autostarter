import * as vscode from 'vscode';
import { MCPServerConfig } from '../types/mcp';

export class ServerConfigPanel {
    private panel: vscode.WebviewPanel | undefined;
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Show the server configuration panel
     */
    async showConfigPanel(config?: MCPServerConfig): Promise<void> {
        const isEdit = !!config;
        const title = isEdit ? `Edit Server: ${config.name}` : 'Add New MCP Server';

        this.panel = vscode.window.createWebviewPanel(
            'mcpServerConfig',
            title,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent(config);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'save':
                        await this.saveServerConfig(message.config, isEdit);
                        break;
                    case 'cancel':
                        this.panel?.dispose();
                        break;
                    case 'test':
                        await this.testServerConfig(message.config);
                        break;
                }
            }
        );
    }

    /**
     * Generate the webview HTML content
     */
    private getWebviewContent(config?: MCPServerConfig): string {
        const configJson = config ? JSON.stringify(config, null, 2) : JSON.stringify({
            id: '',
            name: '',
            type: 'stdio',
            command: '',
            args: [],
            url: '',
            cwd: '',
            env: {},
            autoStart: false,
            enabled: true
        }, null, 2);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Server Configuration</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        input, select, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            box-sizing: border-box;
        }
        
        textarea {
            height: 100px;
            resize: vertical;
            font-family: var(--vscode-editor-font-family);
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: auto;
        }
        
        .button-group {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .test {
            background-color: var(--vscode-testing-iconPassed);
            color: white;
        }
        
        button:hover {
            opacity: 0.9;
        }
        
        .type-specific {
            display: none;
        }
        
        .type-specific.active {
            display: block;
        }
        
        .help-text {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        
        .error {
            color: var(--vscode-errorForeground);
            font-size: 12px;
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <h1>${config ? 'Edit' : 'Add'} MCP Server</h1>
    
    <form id="serverForm">
        <div class="form-group">
            <label for="id">Server ID:</label>
            <input type="text" id="id" name="id" required ${config ? 'readonly' : ''}>
            <div class="help-text">Unique identifier for the server (auto-generated from name if empty)</div>
        </div>
        
        <div class="form-group">
            <label for="name">Server Name:</label>
            <input type="text" id="name" name="name" required>
            <div class="help-text">Display name for the server</div>
        </div>
        
        <div class="form-group">
            <label for="type">Server Type:</label>
            <select id="type" name="type" onchange="toggleTypeSpecificFields()">
                <option value="stdio">Standard I/O (Command-based)</option>
                <option value="http">HTTP Server</option>
                <option value="sse">Server-Sent Events</option>
            </select>
        </div>
        
        <div id="stdio-fields" class="type-specific">
            <div class="form-group">
                <label for="command">Command:</label>
                <input type="text" id="command" name="command">
                <div class="help-text">Command to execute (e.g., "node server.js", "python app.py")</div>
            </div>
            
            <div class="form-group">
                <label for="args">Arguments:</label>
                <input type="text" id="args" name="args">
                <div class="help-text">Command arguments separated by spaces (e.g., "--port 3000 --verbose")</div>
            </div>
            
            <div class="form-group">
                <label for="cwd">Working Directory:</label>
                <input type="text" id="cwd" name="cwd">
                <div class="help-text">Working directory for the command (optional)</div>
            </div>
        </div>
        
        <div id="url-fields" class="type-specific">
            <div class="form-group">
                <label for="url">Server URL:</label>
                <input type="url" id="url" name="url">
                <div class="help-text">URL of the HTTP/SSE server (e.g., "http://localhost:3000")</div>
            </div>
        </div>
        
        <div class="form-group">
            <label for="env">Environment Variables:</label>
            <textarea id="env" name="env" placeholder="KEY1=value1&#10;KEY2=value2"></textarea>
            <div class="help-text">Environment variables in KEY=value format, one per line</div>
        </div>
        
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="autoStart" name="autoStart">
                <label for="autoStart">Auto-start when VSCode opens</label>
            </div>
        </div>
        
        <div class="form-group">
            <div class="checkbox-group">
                <input type="checkbox" id="enabled" name="enabled" checked>
                <label for="enabled">Server enabled</label>
            </div>
        </div>
        
        <div class="button-group">
            <button type="button" class="primary" onclick="saveConfig()">Save</button>
            <button type="button" class="test" onclick="testConfig()">Test Configuration</button>
            <button type="button" class="secondary" onclick="cancel()">Cancel</button>
        </div>
    </form>

    <script>
        const vscode = acquireVsCodeApi();
        const config = ${configJson};
        
        // Initialize form with config data
        function initializeForm() {
            Object.keys(config).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = config[key];
                    } else if (key === 'args' && Array.isArray(config[key])) {
                        element.value = config[key].join(' ');
                    } else if (key === 'env' && typeof config[key] === 'object') {
                        element.value = Object.entries(config[key])
                            .map(([k, v]) => k + '=' + v)
                            .join('\\n');
                    } else {
                        element.value = config[key] || '';
                    }
                }
            });
            
            toggleTypeSpecificFields();
            
            // Auto-generate ID from name if creating new server
            if (!config.id) {
                document.getElementById('name').addEventListener('input', function() {
                    const idField = document.getElementById('id');
                    if (!idField.readOnly) {
                        idField.value = this.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                    }
                });
            }
        }
        
        function toggleTypeSpecificFields() {
            const type = document.getElementById('type').value;
            
            document.querySelectorAll('.type-specific').forEach(el => {
                el.classList.remove('active');
            });
            
            if (type === 'stdio') {
                document.getElementById('stdio-fields').classList.add('active');
            } else {
                document.getElementById('url-fields').classList.add('active');
            }
        }
        
        function saveConfig() {
            const formData = new FormData(document.getElementById('serverForm'));
            const config = {};
            
            for (let [key, value] of formData.entries()) {
                if (key === 'args') {
                    config[key] = value.trim() ? value.trim().split(/\\s+/) : [];
                } else if (key === 'env') {
                    config[key] = {};
                    if (value.trim()) {
                        value.trim().split('\\n').forEach(line => {
                            const [k, ...v] = line.split('=');
                            if (k && v.length > 0) {
                                config[key][k.trim()] = v.join('=').trim();
                            }
                        });
                    }
                } else if (key === 'autoStart' || key === 'enabled') {
                    config[key] = document.getElementById(key).checked;
                } else {
                    config[key] = value;
                }
            }
            
            // Validation
            if (!config.name) {
                alert('Server name is required');
                return;
            }
            
            if (config.type === 'stdio' && !config.command) {
                alert('Command is required for stdio servers');
                return;
            }
            
            if ((config.type === 'http' || config.type === 'sse') && !config.url) {
                alert('URL is required for HTTP/SSE servers');
                return;
            }
            
            vscode.postMessage({
                command: 'save',
                config: config
            });
        }
        
        function testConfig() {
            const formData = new FormData(document.getElementById('serverForm'));
            const config = {};
            
            for (let [key, value] of formData.entries()) {
                config[key] = value;
            }
            
            vscode.postMessage({
                command: 'test',
                config: config
            });
        }
        
        function cancel() {
            vscode.postMessage({
                command: 'cancel'
            });
        }
        
        // Initialize form when page loads
        initializeForm();
    </script>
</body>
</html>`;
    }

    /**
     * Save server configuration
     */
    private async saveServerConfig(configData: any, isEdit: boolean): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('mcp');
            const servers = config.get<Record<string, any>>('servers') || {};

            // Convert form data to server config
            const { id, ...serverConfig } = configData;
            servers[id] = serverConfig;

            await config.update('servers', servers, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage(`Server ${isEdit ? 'updated' : 'created'}: ${configData.name}`);
            this.outputChannel.appendLine(`[INFO] Server ${isEdit ? 'updated' : 'created'}: ${id}`);

            this.panel?.dispose();

            // Refresh tree view
            vscode.commands.executeCommand('mcp-autostarter.refreshView');

        } catch (error) {
            const errorMessage = `Failed to save server configuration: ${error}`;
            vscode.window.showErrorMessage(errorMessage);
            this.outputChannel.appendLine(`[ERROR] ${errorMessage}`);
        }
    }

    /**
     * Test server configuration
     */
    private async testServerConfig(configData: any): Promise<void> {
        try {
            // Basic validation
            if (configData.type === 'stdio' && !configData.command) {
                vscode.window.showErrorMessage('Command is required for stdio servers');
                return;
            }

            if ((configData.type === 'http' || configData.type === 'sse') && !configData.url) {
                vscode.window.showErrorMessage('URL is required for HTTP/SSE servers');
                return;
            }

            // For HTTP/SSE, try to validate URL
            if (configData.url) {
                try {
                    new URL(configData.url);
                    vscode.window.showInformationMessage('✅ URL format is valid');
                } catch {
                    vscode.window.showErrorMessage('❌ Invalid URL format');
                    return;
                }
            }

            // For stdio, check if command exists (basic check)
            if (configData.command) {
                vscode.window.showInformationMessage('✅ Configuration appears valid');
            }

            this.outputChannel.appendLine(`[INFO] Tested configuration for: ${configData.name}`);

        } catch (error) {
            const errorMessage = `Configuration test failed: ${error}`;
            vscode.window.showErrorMessage(errorMessage);
            this.outputChannel.appendLine(`[ERROR] ${errorMessage}`);
        }
    }
}
