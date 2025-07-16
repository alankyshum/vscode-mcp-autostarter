import * as assert from 'assert';
import * as vscode from 'vscode';
import { MCPConfigurationManager } from '../../src/mcpConfigManager';

suite('MCP Configuration Manager Tests', () => {
    let configManager: MCPConfigurationManager;
    let outputChannel: vscode.OutputChannel;

    setup(() => {
        outputChannel = vscode.window.createOutputChannel('Test MCP Config');
        configManager = new MCPConfigurationManager(outputChannel);
    });

    teardown(() => {
        outputChannel.dispose();
    });

    test('Should read MCP configuration without errors', () => {
        const config = configManager.getMCPConfiguration();
        assert.ok(config !== undefined);
        assert.ok(typeof config === 'object');
    });

    test('Should get all server configs as array', () => {
        const configs = configManager.getAllServerConfigs();
        assert.ok(Array.isArray(configs));
    });

    test('Should validate valid server config', () => {
        const validConfig = {
            id: 'test-server',
            name: 'Test Server',
            command: 'node server.js',
            autoStart: true,
            enabled: true
        };

        const result = configManager.validateServerConfig(validConfig);
        assert.ok(result !== null);
        assert.strictEqual(result?.id, 'test-server');
        assert.strictEqual(result?.name, 'Test Server');
        assert.strictEqual(result?.command, 'node server.js');
        assert.strictEqual(result?.autoStart, true);
        assert.strictEqual(result?.enabled, true);
        assert.strictEqual(result?.type, 'stdio'); // Default type
    });

    test('Should validate HTTP server config', () => {
        const httpConfig = {
            id: 'http-server',
            name: 'HTTP Server',
            url: 'http://localhost:3000',
            type: 'http',
            autoStart: false,
            enabled: true
        };

        const result = configManager.validateServerConfig(httpConfig);
        assert.ok(result !== null);
        assert.strictEqual(result?.type, 'http');
        assert.strictEqual(result?.url, 'http://localhost:3000');
    });

    test('Should reject invalid server config', () => {
        const invalidConfig = {
            id: 'invalid-server',
            name: 'Invalid Server',
            // Missing both command and url
            autoStart: false,
            enabled: true
        };

        const result = configManager.validateServerConfig(invalidConfig);
        assert.strictEqual(result, null);
    });

    test('Should handle missing server name', () => {
        const configWithoutName = {
            id: 'no-name-server',
            command: 'node server.js',
            autoStart: true,
            enabled: true
        };

        const result = configManager.validateServerConfig(configWithoutName);
        assert.ok(result !== null);
        assert.strictEqual(result?.name, 'no-name-server'); // Should use ID as name
    });

    test('Should handle default values', () => {
        const minimalConfig = {
            id: 'minimal-server',
            command: 'node server.js'
        };

        const result = configManager.validateServerConfig(minimalConfig);
        assert.ok(result !== null);
        assert.strictEqual(result?.autoStart, false); // Default
        assert.strictEqual(result?.enabled, true); // Default
        assert.strictEqual(result?.type, 'stdio'); // Default
        assert.ok(Array.isArray(result?.args)); // Should be empty array
        assert.ok(typeof result?.env === 'object'); // Should be empty object
    });

    test('Should setup configuration watcher', () => {
        let callbackCalled = false;
        const callback = () => {
            callbackCalled = true;
        };

        const disposable = configManager.setupConfigurationWatcher(callback);
        assert.ok(disposable !== undefined);
        assert.ok(typeof disposable.dispose === 'function');

        // Clean up
        disposable.dispose();
    });

    test('Should handle workspace MCP config gracefully', async () => {
        // This should not throw even if no workspace is open
        const workspaceConfig = await configManager.getWorkspaceMCPConfig();
        assert.ok(typeof workspaceConfig === 'object');
    });
});
