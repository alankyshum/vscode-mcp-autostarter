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
			'mcp-autostarter.enableAutoStart'
		];

		for (const command of expectedCommands) {
			assert.ok(commands.includes(command), `Command ${command} should be registered`);
		}
	});

	test('Configuration should be available', () => {
		const config = vscode.workspace.getConfiguration('mcpAutoStarter');
		assert.ok(config !== undefined);
		
		// Test default values
		assert.strictEqual(config.get('enabled'), true);
		assert.strictEqual(config.get('retryAttempts'), 3);
		assert.strictEqual(config.get('retryDelay'), 2000);
		assert.strictEqual(config.get('configPath'), '');
	});
});
