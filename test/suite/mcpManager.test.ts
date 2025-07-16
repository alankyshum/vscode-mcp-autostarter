import * as assert from 'assert';
import * as vscode from 'vscode';
import { MCPServerManager } from '../../src/mcpManager';
import { MCPServerConfig } from '../../src/types/mcp';

suite('MCP Server Manager Tests', () => {
    let serverManager: MCPServerManager;
    let outputChannel: vscode.OutputChannel;

    setup(() => {
        outputChannel = vscode.window.createOutputChannel('Test MCP Manager');
        serverManager = new MCPServerManager(outputChannel);
    });

    teardown(() => {
        serverManager.dispose();
        outputChannel.dispose();
    });

    test('Should initialize with empty server processes', () => {
        const processes = serverManager.getAllServerProcesses();
        assert.strictEqual(processes.size, 0);
    });

    test('Should return stopped status for non-existent server', () => {
        const status = serverManager.getServerStatus('non-existent');
        assert.strictEqual(status, 'stopped');
    });

    test('Should handle HTTP server configuration', async () => {
        const config: MCPServerConfig = {
            id: 'test-http-server',
            name: 'Test HTTP Server',
            type: 'http',
            url: 'http://localhost:3000',
            autoStart: false,
            enabled: true
        };

        await serverManager.startServer(config);
        const status = serverManager.getServerStatus(config.id);
        assert.strictEqual(status, 'running');
    });

    test('Should handle SSE server configuration', async () => {
        const config: MCPServerConfig = {
            id: 'test-sse-server',
            name: 'Test SSE Server',
            type: 'sse',
            url: 'http://localhost:3001/events',
            autoStart: false,
            enabled: true
        };

        await serverManager.startServer(config);
        const status = serverManager.getServerStatus(config.id);
        assert.strictEqual(status, 'running');
    });

    test('Should reject stdio server without command', async () => {
        const config: MCPServerConfig = {
            id: 'test-invalid-server',
            name: 'Test Invalid Server',
            type: 'stdio',
            autoStart: false,
            enabled: true
        };

        try {
            await serverManager.startServer(config);
            assert.fail('Should have thrown an error for missing command');
        } catch (error) {
            assert.ok(error instanceof Error);
            assert.ok(error.message.includes('No command specified'));
        }
    });

    test('Should track retry counts', () => {
        const serverId = 'test-server';
        
        // Initial retry count should be 0
        assert.strictEqual(serverManager.getRetryCount(serverId), 0);
        
        // Reset should work even for non-existent servers
        serverManager.resetRetryCount(serverId);
        assert.strictEqual(serverManager.getRetryCount(serverId), 0);
    });

    test('Should stop all servers on dispose', async () => {
        const config1: MCPServerConfig = {
            id: 'test-server-1',
            name: 'Test Server 1',
            type: 'http',
            url: 'http://localhost:3000',
            autoStart: false,
            enabled: true
        };

        const config2: MCPServerConfig = {
            id: 'test-server-2',
            name: 'Test Server 2',
            type: 'sse',
            url: 'http://localhost:3001',
            autoStart: false,
            enabled: true
        };

        await serverManager.startServer(config1);
        await serverManager.startServer(config2);

        // Both should be running
        assert.strictEqual(serverManager.getServerStatus(config1.id), 'running');
        assert.strictEqual(serverManager.getServerStatus(config2.id), 'running');

        // Dispose should stop all
        serverManager.dispose();

        // Both should be stopped
        assert.strictEqual(serverManager.getServerStatus(config1.id), 'stopped');
        assert.strictEqual(serverManager.getServerStatus(config2.id), 'stopped');
    });

    test('Should handle duplicate server start gracefully', async () => {
        const config: MCPServerConfig = {
            id: 'test-duplicate-server',
            name: 'Test Duplicate Server',
            type: 'http',
            url: 'http://localhost:3000',
            autoStart: false,
            enabled: true
        };

        // Start server first time
        await serverManager.startServer(config);
        assert.strictEqual(serverManager.getServerStatus(config.id), 'running');

        // Start server second time - should not throw error
        await serverManager.startServer(config);
        assert.strictEqual(serverManager.getServerStatus(config.id), 'running');
    });
});
