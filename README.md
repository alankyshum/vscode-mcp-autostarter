# MCP Auto-Starter

A VSCode extension that automatically starts your MCP (Model Context Protocol) servers when VSCode opens. Just add `"autoStart": true` to your server configuration.

## Features

- **Auto-start MCP servers** - Automatically starts servers with `"autoStart": true` when VSCode opens
- **Simple setup** - Just add one line to your existing MCP configuration
- **Works everywhere** - Local VSCode, remote SSH, Codespaces, containers
- **Clean integration** - Servers run in dedicated output channels, not terminals
- **Smart validation** - Validates configurations before starting servers

## How to Use

1. **Install the extension** from VS Code Marketplace or [download the latest release](https://github.com/alankyshum/vscode-mcp-autostarter/releases/latest)

2. **Configure your MCP servers** using "MCP: Open User Configuration" command

3. **Add `"autoStart": true`** to any server you want to start automatically:
   ```json
   {
     "servers": {
       "sequentialthinking": {
         "type": "stdio",
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-sequential-thinking@latest"],
         "autoStart": true
       }
     }
   }
   ```

4. **Restart VSCode** - servers with autoStart will start automatically

### Commands
- **MCP-AutoStarter: Enable auto-start for currently running MCP servers** - Enable auto-start for existing servers

### Settings
- `mcpAutoStarter.enabled`: Enable/disable auto-starting (default: true)
- `mcpAutoStarter.retryAttempts`: Retry attempts when starting fails (default: 3)
- `mcpAutoStarter.retryDelay`: Delay between retries in ms (default: 2000)
- `mcpAutoStarter.configPath`: Custom MCP config file path (auto-detect if empty)

## How to Develop

1. **Clone and setup**
   ```bash
   git clone https://github.com/alankyshum/vscode-mcp-autostarter.git
   cd vscode-mcp-autostarter
   npm install
   ```

2. **Build and test**
   ```bash
   npm run compile    # Build TypeScript
   npm run watch      # Watch mode for development
   npm test          # Run tests
   ```

3. **Debug**
   - Open project in VSCode
   - Press `F5` to start debugging
   - Extension loads in new Development Host window

4. **Package and publish**
   ```bash
   npm run package                    # Create .vsix file
   export VSCE_PAT=your_token_here   # Set Personal Access Token
   npm run publish                   # Publish to marketplace
   ```

See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for detailed instructions.

## Changelog

### 0.1.2
- Published to VS Code Marketplace
- Added comprehensive development guide
- Improved extension categorization as "AI"
- Updated documentation and build configuration

### 0.1.1
- Updated dependencies and build tools
- Enhanced extension packaging

### 0.1.0
- Initial release with auto-start functionality
- MCP server process management
- Configuration file watching and validation
- VSCode integration with existing MCP commands

## License

MIT License - see [LICENSE](LICENSE) file for details.
