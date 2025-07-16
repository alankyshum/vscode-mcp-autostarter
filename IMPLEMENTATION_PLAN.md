# VSCode MCP Auto-Starter Extension Implementation Plan

## Overview
Create a VSCode extension that allows users to manage auto-start functionality for their existing MCP (Model Context Protocol) server configurations. The extension will provide a workbench panel widget to toggle auto-start settings and automatically launch selected MCP servers when VSCode starts.

## Research Summary

### Key Findings from Technical Research:

1. **MCP Configuration Access**: Use `vscode.workspace.getConfiguration('mcp')` instead of direct file system access
2. **Settings Backup**: Extension settings automatically sync via VSCode Settings Sync when properly configured
3. **System Prompt Injection**: Direct Copilot prompt injection not supported; alternative: custom chat participants
4. **VSCode APIs**: Comprehensive APIs available for tree views, process management, and configuration watching

## 1. Project Structure & Setup

### 1.1 Initialize Extension Project
```
vscode-mcp-autostarter/
├── package.json                 # Extension manifest
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── extension.ts            # Main extension entry point
│   ├── mcpManager.ts           # MCP server management logic
│   ├── mcpProvider.ts          # Tree view data provider
│   ├── webview/
│   │   ├── mcpPanel.ts         # Webview panel controller
│   │   └── panel.html          # HTML for the panel UI
│   └── types/
│       └── mcp.ts              # TypeScript interfaces
├── resources/                  # Icons and assets
├── test/                       # Unit tests
└── README.md
```

### 1.2 Project Initialization (Recommended Approach)
Use Yeoman generator for VSCode extensions:
```bash
npx --package yo --package generator-code -- yo code
# Select: New Extension (TypeScript)
# Choose: Tree View provider template
```

### 1.3 Dependencies
- `@types/vscode`: VSCode API types
- `@types/node`: Node.js types for process management
- `typescript`: TypeScript compiler
- `@vscode/test-electron`: Testing framework
- `mocha`: Testing framework (recommended by VSCode)
- `sinon`: Mocking library for testing external processes

## 2. Core Components

### 2.1 MCP Configuration Schema
Define the structure for MCP server configurations:

```typescript
interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  autoStart: boolean;
  enabled: boolean;
}

interface MCPExtensionSettings {
  servers: MCPServerConfig[];
  globalAutoStart: boolean;
}
```

### 2.2 Extension Manifest (package.json)
Key configuration sections:
- **Activation Events**: `onStartupFinished`, `onCommand`
- **Contributes**:
  - Views (sidebar panel)
  - Commands (toggle, start, stop)
  - Configuration schema
  - Menus and context menus

### 2.3 Main Extension Logic (extension.ts)
- **Activation**: Read settings, auto-start enabled servers
- **Command Registration**: Toggle, start, stop, refresh commands
- **Settings Monitoring**: Watch for configuration changes
- **Cleanup**: Proper deactivation and process termination

## 3. User Interface Components

### 3.1 Workbench Panel Widget (Tree View Provider - Recommended)
**Use VSCode Tree View APIs** for native integration:

```typescript
class MCPTreeDataProvider implements vscode.TreeDataProvider<MCPServerItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MCPServerItem | undefined | null | void> = new vscode.EventEmitter<MCPServerItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MCPServerItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private serverManager: MCPServerManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MCPServerItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None);
    item.contextValue = 'mcpServer';
    item.tooltip = `${element.name} - ${element.status}`;

    // Status icons
    switch (element.status) {
      case 'running':
        item.iconPath = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
        break;
      case 'stopped':
        item.iconPath = new vscode.ThemeIcon('stop-circle', new vscode.ThemeColor('testing.iconFailed'));
        break;
      case 'error':
        item.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconErrored'));
        break;
    }

    return item;
  }

  getChildren(element?: MCPServerItem): Thenable<MCPServerItem[]> {
    if (!element) {
      // Root level - return all servers
      return Promise.resolve(this.getMCPServers());
    }
    return Promise.resolve([]);
  }

  private getMCPServers(): MCPServerItem[] {
    // Get servers from configuration and add status
    const config = new MCPConfigurationManager();
    const servers = config.getMCPConfiguration();

    return Object.entries(servers).map(([id, serverConfig]) => ({
      id,
      name: serverConfig.name || id,
      status: this.serverManager.getServerStatus(id),
      autoStart: serverConfig.autoStart || false,
      config: serverConfig
    }));
  }
}
```

**Registration in package.json:**
```json
{
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "mcpServers",
          "name": "MCP Servers",
          "when": "true"
        }
      ]
    },
    "menus": {
      "view/item/context": [
        {
          "command": "mcp-autostarter.toggleAutoStart",
          "when": "view == mcpServers && viewItem == mcpServer"
        },
        {
          "command": "mcp-autostarter.startServer",
          "when": "view == mcpServers && viewItem == mcpServer"
        }
      ]
    }
  }
}
```

### 3.2 Tree View Structure
```
MCP Servers
├── 📡 mcpServer1 [Auto-start: ON]  ● Running
├── 📡 mcpServer2 [Auto-start: OFF] ○ Stopped
└── 📡 mcpServer3 [Auto-start: ON]  ⚠ Error
```

### 3.3 Context Menu Actions
- Toggle Auto-start
- Start/Stop Server
- Edit Configuration
- View Logs
- Remove Server

## 4. MCP Configuration Discovery (API-Based Approach)

### 4.1 Programmatic Configuration Access
**Recommended**: Use VSCode APIs instead of direct file system access:

```typescript
class MCPConfigurationManager {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('MCP Auto-Starter');
  }

  // Primary method: Use VSCode Configuration API
  getMCPConfiguration(): Record<string, any> {
    try {
      const config = vscode.workspace.getConfiguration('mcp');
      const servers = config.get<Record<string, any>>('servers') || {};

      // Filter out internal VSCode settings (e.g., mcp-server-time)
      const userServers = Object.fromEntries(
        Object.entries(servers).filter(([key]) => !key.includes('-internal'))
      );

      return userServers;
    } catch (error) {
      this.outputChannel.appendLine(`[ERROR] Failed to read MCP config: ${error}`);
      return {};
    }
  }

  // Watch for configuration changes
  setupConfigurationWatcher(): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('mcp')) {
        this.outputChannel.appendLine('[INFO] MCP configuration changed');
        this.onConfigurationChanged();
      }
    });
  }

  // Fallback: File system access for workspace-specific configs
  async getWorkspaceMCPConfig(): Promise<Record<string, any>> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return {};

    const mcpConfigPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'mcp.json');

    try {
      const configData = await vscode.workspace.fs.readFile(mcpConfigPath);
      return JSON.parse(configData.toString());
    } catch (error) {
      // File doesn't exist or is invalid - this is normal
      return {};
    }
  }

  private onConfigurationChanged(): void {
    // Trigger tree view refresh, restart servers, etc.
    vscode.commands.executeCommand('mcp-autostarter.refresh');
  }
}
```

### 4.2 Configuration File Format Support
- **Primary Format**: `mcp.json` with servers object
- **Legacy Format**: `settings.json` with mcp section (for backward compatibility)
- **Schema Validation**: Validate against MCP configuration schema
- **Variable Substitution**: Support `${workspaceFolder}`, `${env:VAR}`, `${input:ID}`

## 5. MCP Server Management

### 5.1 Process Lifecycle Management (VSCode APIs)
**Recommended**: Use VSCode Task API for better integration:

```typescript
class MCPServerManager {
  private runningTasks: Map<string, vscode.Task> = new Map();
  private terminals: Map<string, vscode.Terminal> = new Map();
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('MCP Servers');
  }

  // Use VSCode Task API for process management
  async startServer(config: MCPServerConfig): Promise<void> {
    const taskDefinition: vscode.TaskDefinition = {
      type: 'mcp-server',
      serverId: config.id,
      serverName: config.name
    };

    const execution = new vscode.ProcessExecution(
      config.command,
      config.args || [],
      {
        cwd: config.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        env: { ...process.env, ...config.env }
      }
    );

    const task = new vscode.Task(
      taskDefinition,
      vscode.TaskScope.Workspace,
      config.name,
      'MCP',
      execution
    );

    // Execute task and track it
    const taskExecution = await vscode.tasks.executeTask(task);
    this.runningTasks.set(config.id, task);

    this.outputChannel.appendLine(`[INFO] Started MCP server: ${config.name}`);
  }

  // Alternative: Use Terminal for interactive servers
  async startServerInTerminal(config: MCPServerConfig): Promise<void> {
    const terminal = vscode.window.createTerminal({
      name: `MCP: ${config.name}`,
      cwd: config.cwd,
      env: config.env
    });

    terminal.sendText(`${config.command} ${config.args?.join(' ') || ''}`);
    this.terminals.set(config.id, terminal);
  }

  async stopServer(serverId: string): Promise<void> {
    // Stop task-based server
    const task = this.runningTasks.get(serverId);
    if (task) {
      vscode.tasks.taskExecutions.forEach(execution => {
        if (execution.task === task) {
          execution.terminate();
        }
      });
      this.runningTasks.delete(serverId);
    }

    // Stop terminal-based server
    const terminal = this.terminals.get(serverId);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(serverId);
    }

    this.outputChannel.appendLine(`[INFO] Stopped MCP server: ${serverId}`);
  }

  getServerStatus(serverId: string): 'running' | 'stopped' | 'error' {
    if (this.runningTasks.has(serverId) || this.terminals.has(serverId)) {
      return 'running';
    }
    return 'stopped';
  }
}
```

### 4.2 Auto-start Logic
- **On Extension Activation**: Start servers with `autoStart: true`
- **On Settings Change**: React to configuration updates using file watchers
- **Error Handling**: Retry logic, user notifications
- **Process Monitoring**: Health checks, automatic restarts
- **Configuration Watching**: Monitor mcp.json files for changes

### 5.3 Configuration Integration Examples
```typescript
interface MCPServerConfig {
  id: string;
  name: string;
  type: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  cwd?: string;
  autoStart: boolean;
  enabled: boolean;
}

// Example mcp.json structure
{
  "inputs": [
    {
      "type": "promptString",
      "id": "api-key",
      "description": "API Key",
      "password": true
    }
  ],
  "servers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "perplexity": {
      "type": "stdio",
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/perplexity-ask"],
      "env": {
        "PERPLEXITY_API_KEY": "${input:api-key}"
      }
    }
  }
}
```

## 6. Settings and Configuration

### 6.1 Configuration Schema (package.json)
```json
{
  "contributes": {
    "configuration": {
      "title": "MCP Auto-Starter",
      "properties": {
        "mcpAutoStarter.servers": {
          "type": "array",
          "description": "MCP server configurations",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "name": {"type": "string"},
              "command": {"type": "string"},
              "args": {"type": "array"},
              "autoStart": {"type": "boolean"},
              "enabled": {"type": "boolean"}
            }
          }
        },
        "mcpAutoStarter.globalAutoStart": {
          "type": "boolean",
          "default": true,
          "description": "Enable global auto-start functionality"
        }
      }
    }
  }
}
```

### 6.2 Settings Migration
- **Import Existing Configurations**: Detect and import from other MCP extensions
- **Export/Import**: Allow users to backup and restore configurations
- **Validation**: Ensure configuration integrity

## 7. Commands and Actions

### 7.1 Command Registration
```typescript
const commands = [
  'mcpAutoStarter.toggleAutoStart',
  'mcpAutoStarter.startServer',
  'mcpAutoStarter.stopServer',
  'mcpAutoStarter.restartServer',
  'mcpAutoStarter.addServer',
  'mcpAutoStarter.editServer',
  'mcpAutoStarter.removeServer',
  'mcpAutoStarter.refreshView',
  'mcpAutoStarter.viewLogs'
];
```

### 7.2 Keyboard Shortcuts
- Quick toggle for selected server
- Start/stop all servers
- Open MCP panel

## 8. Error Handling and Logging

### 8.1 Error Management
- **Process Failures**: Capture and display server startup errors
- **Configuration Errors**: Validate settings and show helpful messages
- **Network Issues**: Handle connection problems gracefully
- **Permission Issues**: Guide users through permission setup

### 8.2 Logging System
- **Output Channel**: Dedicated VSCode output channel for logs
- **Log Levels**: Debug, Info, Warning, Error
- **Server Logs**: Capture and display individual server logs
- **Persistent Logging**: Optional file-based logging

## 9. Testing Strategy (VSCode Recommended Approach)

### 9.1 Unit Tests (Mocha + Sinon)
**Framework**: Use `@vscode/test-electron` with Mocha:

```typescript
// test/suite/mcpManager.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { MCPServerManager } from '../../src/mcpManager';

suite('MCP Server Manager Tests', () => {
  let serverManager: MCPServerManager;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    serverManager = new MCPServerManager();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('Should start server with valid configuration', async () => {
    const mockConfig = {
      id: 'test-server',
      name: 'Test Server',
      command: 'node',
      args: ['server.js'],
      autoStart: true,
      enabled: true
    };

    // Mock VSCode APIs
    const executeTaskStub = sandbox.stub(vscode.tasks, 'executeTask');

    await serverManager.startServer(mockConfig);

    assert(executeTaskStub.calledOnce);
  });
});
```

### 9.2 Integration Tests (Extension Test Runner)
**Setup**: Use VSCode Extension Test Runner:

```typescript
// test/runTest.ts
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions'] // Isolate extension testing
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
```

### 9.3 UI Testing (vscode-extension-tester)
**For complex UI interactions**:

```bash
npm install --save-dev vscode-extension-tester
```

```typescript
// test/ui/treeView.test.ts
import { VSBrowser, WebDriver } from 'vscode-extension-tester';

describe('MCP Tree View UI Tests', () => {
  let driver: WebDriver;

  before(async () => {
    driver = VSBrowser.instance.driver;
  });

  it('Should display MCP servers in tree view', async () => {
    // Test tree view interactions
    const explorer = await new SideBarView().getContent();
    const mcpSection = await explorer.getSection('MCP Servers');

    assert(mcpSection);
  });
});
```

### 9.4 Manual Testing Checklist
- [ ] Cross-platform compatibility (Windows, macOS, Linux)
- [ ] Different MCP server types (stdio, http, sse)
- [ ] VSCode restart scenarios
- [ ] Settings sync across devices
- [ ] Error conditions and recovery
- [ ] Performance with multiple servers

## 10. Security Considerations

### 10.1 Process Security
- **Command Validation**: Sanitize server commands and arguments
- **Path Validation**: Ensure safe working directories
- **Environment Variables**: Secure handling of sensitive data
- **Process Isolation**: Proper cleanup and resource management

### 10.2 Configuration Security
- **Input Sanitization**: Validate all user inputs
- **Privilege Escalation**: Avoid running servers with elevated privileges
- **Secrets Management**: Secure storage of API keys and tokens

## 11. Performance Optimization

### 11.1 Startup Performance
- **Lazy Loading**: Load components only when needed
- **Async Operations**: Non-blocking server startup
- **Caching**: Cache server status and configurations
- **Debouncing**: Limit rapid configuration changes

### 11.2 Resource Management
- **Memory Usage**: Monitor and limit memory consumption
- **Process Limits**: Prevent too many concurrent servers
- **Cleanup**: Proper resource disposal on deactivation

## 12. User Experience Enhancements

### 12.1 Visual Indicators
- **Status Icons**: Clear visual representation of server states
- **Progress Indicators**: Show startup/shutdown progress
- **Notifications**: Non-intrusive status updates
- **Tooltips**: Helpful information on hover

### 12.2 Accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Support for high contrast themes
- **Internationalization**: Multi-language support preparation

## 13. Deployment and Distribution

### 13.1 Packaging
- **Extension Packaging**: Use `vsce` to create `.vsix` files
- **Marketplace Publishing**: Prepare for VSCode Marketplace
- **Version Management**: Semantic versioning strategy
- **Release Notes**: Comprehensive changelog

### 13.2 Documentation
- **README**: Installation and usage instructions
- **Configuration Guide**: Detailed setup documentation
- **Troubleshooting**: Common issues and solutions
- **API Documentation**: For potential integrations

## 14. Future Enhancements

### 14.1 Advanced Features
- **Server Templates**: Pre-configured server templates
- **Health Monitoring**: Advanced server health checks
- **Load Balancing**: Multiple instances of the same server
- **Remote Servers**: Support for remote MCP servers

### 14.2 Integration Opportunities
- **Other Extensions**: Integration with popular VSCode extensions
- **CI/CD**: Integration with development workflows
- **Cloud Services**: Support for cloud-hosted MCP servers
- **Monitoring Tools**: Integration with monitoring platforms

## 15. Implementation Phases

### Phase 1: Core Foundation (Week 1-2)
- [ ] Set up extension project structure
- [ ] Implement basic MCP server configuration schema
- [ ] Create main extension entry point with activation logic
- [ ] Implement basic server process management
- [ ] Add configuration reading from VSCode settings

### Phase 2: User Interface (Week 3-4)
- [ ] Implement Tree View Provider for MCP servers
- [ ] Add context menu actions (start, stop, toggle auto-start)
- [ ] Create status indicators and icons
- [ ] Implement command registration and handlers
- [ ] Add basic error notifications

### Phase 3: Auto-start Functionality (Week 5-6)
- [ ] Implement auto-start logic on extension activation
- [ ] Add settings change monitoring and reaction
- [ ] Implement server health monitoring
- [ ] Add retry logic for failed server starts
- [ ] Create logging and output channel

### Phase 4: Polish and Testing (Week 7-8)
- [ ] Comprehensive error handling and user feedback
- [ ] Unit and integration tests
- [ ] Cross-platform testing
- [ ] Performance optimization
- [ ] Documentation and README

### Phase 5: Advanced Features (Week 9-10)
- [ ] Settings import/export functionality
- [ ] Advanced server configuration options
- [ ] Enhanced logging and debugging features
- [ ] Custom chat participant for system prompts (Copilot alternative)
- [ ] Accessibility improvements
- [ ] Marketplace preparation

## 15.1 System Prompt Injection Alternative

Since direct Copilot prompt injection is not supported, implement a **Custom Chat Participant**:

```typescript
// Custom chat participant for MCP-enhanced conversations
class MCPChatParticipant {
  constructor(private context: vscode.ExtensionContext) {
    this.registerChatParticipant();
  }

  private registerChatParticipant() {
    const participant = vscode.chat.createChatParticipant('mcp-assistant', this.handleChatRequest.bind(this));
    participant.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'mcp-icon.png');
    participant.followupProvider = {
      provideFollowups: this.provideFollowups.bind(this)
    };

    this.context.subscriptions.push(participant);
  }

  private async handleChatRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {

    // Inject user's system prompt
    const systemPrompt = vscode.workspace.getConfiguration('mcp-autostarter').get<string>('systemPrompt', '');

    if (systemPrompt) {
      stream.markdown(`**System Context**: ${systemPrompt}\n\n`);
    }

    // Enhanced prompt with MCP server context
    const mcpServers = this.getActiveMCPServers();
    if (mcpServers.length > 0) {
      stream.markdown(`**Available MCP Tools**: ${mcpServers.join(', ')}\n\n`);
    }

    // Process the request with enhanced context
    stream.markdown(`Processing your request with MCP context...\n`);

    return { metadata: { command: 'mcp-enhanced-chat' } };
  }

  private getActiveMCPServers(): string[] {
    const configManager = new MCPConfigurationManager();
    const servers = configManager.getMCPConfiguration();
    return Object.keys(servers).filter(id =>
      new MCPServerManager().getServerStatus(id) === 'running'
    );
  }

  private provideFollowups(): vscode.ChatFollowup[] {
    return [
      {
        prompt: 'Show me available MCP servers',
        label: '🔧 List MCP Servers'
      },
      {
        prompt: 'Help me configure a new MCP server',
        label: '⚙️ Configure MCP'
      }
    ];
  }
}
```

**Configuration for System Prompts:**
```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "mcp-autostarter.systemPrompt": {
          "type": "string",
          "default": "",
          "description": "Custom system prompt to inject into MCP chat sessions",
          "scope": "application"
        }
      }
    }
  }
}
```

## 16. Technical Requirements

### 16.1 VSCode API Requirements
- **Minimum VSCode Version**: 1.74.0 (for latest Tree View APIs)
- **Node.js Version**: 16.x or higher
- **TypeScript Version**: 4.9 or higher

### 16.2 Platform Support
- **Windows**: Windows 10/11
- **macOS**: macOS 10.15 or higher
- **Linux**: Ubuntu 18.04 or equivalent

### 16.3 Dependencies
```json
{
  "engines": {
    "vscode": "^1.74.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "@types/node": "16.x",
    "@typescript-eslint/eslint-plugin": "^5.45.0",
    "@typescript-eslint/parser": "^5.45.0",
    "@vscode/test-electron": "^2.2.0",
    "eslint": "^8.28.0",
    "typescript": "^4.9.4"
  }
}
```

## 17. Success Metrics

### 17.1 Functionality Metrics
- [ ] Successfully reads existing MCP configurations from VSCode settings
- [ ] Displays all configured MCP servers in the workbench panel
- [ ] Auto-start toggle works reliably for each server
- [ ] Servers start automatically on VSCode startup when enabled
- [ ] Process management handles server lifecycle correctly

### 17.2 User Experience Metrics
- [ ] Extension activates within 2 seconds of VSCode startup
- [ ] UI is responsive and provides immediate feedback
- [ ] Error messages are clear and actionable
- [ ] No memory leaks or resource issues during extended use
- [ ] Cross-platform compatibility verified

### 17.3 Quality Metrics
- [ ] 90%+ test coverage for core functionality
- [ ] Zero critical security vulnerabilities
- [ ] Passes all VSCode extension marketplace requirements
- [ ] Documentation is comprehensive and up-to-date
- [ ] Code follows TypeScript and VSCode extension best practices

---

This implementation plan provides a comprehensive roadmap for creating a robust VSCode extension that effectively manages MCP server auto-start functionality while maintaining security, performance, and user experience standards.
