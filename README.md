# MCP Auto-Starter

A VSCode extension that automatically starts and manages MCP (Model Context Protocol) servers.

## Features

- **Auto-start MCP servers** when VSCode starts
- **Tree view** showing all configured MCP servers with their status
- **Toggle auto-start** functionality for individual servers
- **Start/Stop/Restart** servers manually
- **Real-time status monitoring** with visual indicators
- **Configuration management** through VSCode settings

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to open a new Extension Development Host window

## Usage

### Viewing MCP Servers

The extension adds a "MCP Servers" view to the Explorer sidebar, showing:
- Server name and status
- Auto-start configuration (ON/OFF)
- Visual status indicators:
  - ● Green circle: Running
  - ○ Gray circle: Stopped
  - ⚠ Yellow warning: Error
  - ⟳ Spinning: Starting/Stopping

### Managing Servers

Right-click on any server in the tree view to:
- Toggle auto-start on/off
- Start/Stop/Restart the server
- View logs

### Configuration

The extension reads MCP server configurations from your VSCode settings (`mcp.servers`). Example configuration:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "name": "My MCP Server",
        "command": "node",
        "args": ["server.js"],
        "cwd": "/path/to/server",
        "autoStart": true,
        "enabled": true
      }
    }
  }
}
```

### Extension Settings

- `mcpAutoStarter.globalAutoStart`: Enable/disable global auto-start functionality (default: true)
- `mcpAutoStarter.systemPrompt`: Custom system prompt for MCP chat sessions

## Development

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm test
```

### Debugging

1. Open the project in VSCode
2. Press `F5` to start debugging
3. A new Extension Development Host window will open with the extension loaded

## Requirements

- VSCode 1.74.0 or higher
- Node.js 16.x or higher

## Known Issues

- Server health monitoring is basic and may not detect all failure modes
- Terminal-based servers don't have automatic restart on failure

## Release Notes

### 0.1.0

Initial release with basic auto-start functionality and tree view management.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
