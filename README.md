# MCP Auto-Starter

[![GitHub release](https://img.shields.io/github/release/alankyshum/vscode-mcp-autostarter.svg)](https://github.com/alankyshum/vscode-mcp-autostarter/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/alankyshum/vscode-mcp-autostarter/total.svg)](https://github.com/alankyshum/vscode-mcp-autostarter/releases)
[![CI](https://github.com/alankyshum/vscode-mcp-autostarter/workflows/CI/badge.svg)](https://github.com/alankyshum/vscode-mcp-autostarter/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive VSCode extension that automatically starts and manages MCP (Model Context Protocol) servers with advanced monitoring, health checks, and user-friendly management features.

## ✨ Features

- **🚀 Auto-start MCP servers** when VSCode starts with intelligent retry logic
- **📊 Tree view** showing all configured MCP servers with real-time status
- **🔄 Toggle auto-start** functionality for individual servers
- **⚡ Start/Stop/Restart** servers manually with one-click actions
- **💚 Health monitoring** with automatic failure detection and recovery
- **📈 Performance monitoring** with detailed metrics and issue detection
- **🛠️ Easy server management** - add, edit, and remove servers through UI
- **🎯 Multiple server types** - support for stdio, HTTP, and SSE servers
- **📝 Comprehensive logging** with detailed output channel
- **⚙️ Configuration management** through VSCode settings with validation

## 📦 Installation

### 🎯 Quick Install (Recommended)

**[📥 Download Latest Release](https://github.com/alankyshum/vscode-mcp-autostarter/releases/latest)**

1. **Download the `.vsix` file** from the latest release
2. **Open VS Code**
3. **Press `Ctrl+Shift+P`** (or `Cmd+Shift+P` on Mac)
4. **Type "Extensions: Install from VSIX..."**
5. **Select the downloaded `.vsix` file**
6. **Restart VS Code** if prompted

### 🛍️ From VS Code Marketplace

*Coming soon! The extension will be available on the VS Code Marketplace.*

### 🔧 Development Setup

For developers who want to build from source:

1. **Clone this repository**
   ```bash
   git clone https://github.com/alankyshum/vscode-mcp-autostarter.git
   cd vscode-mcp-autostarter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run compile
   ```

4. **Test in development**
   - Press `F5` to open a new Extension Development Host window
   - Or package manually: `npm run package`

## 🚀 Quick Start

1. Install the extension
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run `MCP Auto-Starter: Add Server` to add your first MCP server
4. Configure your server settings in the tree view
5. Enable auto-start and enjoy automatic server management!

## 📖 Usage

### 👀 Viewing MCP Servers

The extension adds a "MCP Servers" view to the Explorer sidebar, showing:
- **Server name and status** with detailed tooltips
- **Auto-start configuration** (ON/OFF)
- **Server type** (stdio, HTTP, SSE)
- **Visual status indicators**:
  - 🟢 **Running** - Server is active and healthy
  - ⚫ **Stopped** - Server is not running
  - 🟡 **Starting** - Server is being started
  - 🔴 **Error** - Server failed to start or crashed
  - 🔄 **Stopping** - Server is being stopped

### 🎛️ Managing Servers

**Tree View Actions:**
- **Double-click** any server to view detailed information
- **Right-click** for context menu with options:
  - Toggle auto-start on/off
  - Start/Stop/Restart the server
  - View server details
  - Edit server configuration
  - Remove server
  - View logs

**Toolbar Actions:**
- **Refresh** - Update server status
- **Add Server** - Create a new MCP server configuration
- **Restart Failed Servers** - Restart all servers in error state

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

## 🚀 Releases

All releases are automatically built and published via GitHub Actions. You can find the latest releases here:

**[📋 View All Releases](https://github.com/alankyshum/vscode-mcp-autostarter/releases)**

Each release includes:
- 📦 **VSIX package** for direct installation
- 📝 **Release notes** with changes and improvements
- ✅ **Automated testing** ensures quality

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Run tests**: `npm test`
5. **Submit a pull request**

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Ensure CI passes before submitting PR

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the MCP community**

If you find this extension helpful, please ⭐ star the repository and share it with others!
