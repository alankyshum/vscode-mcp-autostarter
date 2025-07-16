import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('alankyshum.vscode-mcp-autostarter'));
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('alankyshum.vscode-mcp-autostarter');
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive);
        }
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        
        const expectedCommands = [
            'mcp-autostarter.toggleAutoStart',
            'mcp-autostarter.startServer',
            'mcp-autostarter.stopServer',
            'mcp-autostarter.restartServer',
            'mcp-autostarter.refreshView',
            'mcp-autostarter.viewLogs',
            'mcp-autostarter.showServerDetails',
            'mcp-autostarter.addServer',
            'mcp-autostarter.editServer',
            'mcp-autostarter.removeServer'
        ];

        for (const command of expectedCommands) {
            assert.ok(commands.includes(command), `Command ${command} should be registered`);
        }
    });

    test('Configuration should be accessible', () => {
        const config = vscode.workspace.getConfiguration('mcpAutoStarter');
        assert.ok(config !== undefined);
        
        // Test default values
        const globalAutoStart = config.get('globalAutoStart');
        assert.strictEqual(globalAutoStart, true);
    });

    test('MCP configuration should be readable', () => {
        const config = vscode.workspace.getConfiguration('mcp');
        assert.ok(config !== undefined);
        
        // Should be able to get servers (even if empty)
        const servers = config.get('servers');
        assert.ok(servers !== undefined);
    });
});
