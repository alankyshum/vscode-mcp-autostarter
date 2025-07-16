/**
 * MCP Server Configuration Interface
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  type?: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  cwd?: string;
  env?: Record<string, string>;
  autoStart: boolean;
  enabled: boolean;
}

/**
 * Extension Settings Interface
 */
export interface MCPExtensionSettings {
  servers: MCPServerConfig[];
  globalAutoStart: boolean;
  systemPrompt?: string;
}

/**
 * Server Status Types
 */
export type ServerStatus = 'running' | 'stopped' | 'error' | 'starting' | 'stopping';

/**
 * MCP Server Item for Tree View
 */
export interface MCPServerItem {
  id: string;
  name: string;
  status: ServerStatus;
  autoStart: boolean;
  config: MCPServerConfig;
}

/**
 * Server Process Information
 */
export interface ServerProcess {
  id: string;
  task?: any; // vscode.Task
  terminal?: any; // vscode.Terminal
  startTime: Date;
  status: ServerStatus;
}

/**
 * Configuration Change Event
 */
export interface ConfigurationChangeEvent {
  type: 'added' | 'removed' | 'modified';
  serverId: string;
  config?: MCPServerConfig;
}
