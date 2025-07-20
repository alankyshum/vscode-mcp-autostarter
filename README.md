# MCP Auto-Starter

[![GitHub release](https://img.shields.io/github/release/alankyshum/vscode-mcp-autostarter.svg)](https://github.com/alankyshum/vscode-mcp-autostarter/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/alankyshum/vscode-mcp-autostarter/total.svg)](https://github.com/alankyshum/vscode-mcp-autostarter/releases)
[![CI](https://github.com/alankyshum/vscode-mcp-autostarter/workflows/CI/badge.svg)](https://github.com/alankyshum/vscode-mcp-autostarter/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simple VSCode extension that automatically starts your MCP (Model Context Protocol) servers when VSCode opens. Just add `"autoStart": true` to your server configuration and you're done!

## ✨ Key Features

- **🚀 Auto-start MCP servers** - Automatically starts servers with `"autoStart": true` when VSCode opens
- **📝 Simple setup** - Just add one line to your existing MCP configuration
- **🌐 Works everywhere** - Local VSCode, remote SSH, Codespaces, containers - all supported
- **📊 Clean integration** - Servers run in dedicated output channels, not terminals
- **🔄 Live updates** - Automatically detects and applies configuration changes
- **⚙️ Smart validation** - Validates configurations before starting servers
- **🎯 Focused scope** - Supports stdio MCP servers (the most common type)

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
2. Configure your MCP servers in the MCP configuration file (use "MCP: Open User Configuration" command)
3. Add `"autoStart": true` to any server you want to start automatically
4. Restart VSCode or reload the window - servers with autoStart will start automatically
5. Use the Command Palette command "MCP-AutoStarter: Enable auto-start for currently running MCP servers" to enable auto-start for existing servers

### Example Configuration

Add this to your MCP configuration file (`mcp.json`):

```json
{
  "servers": {
    "sequentialthinking": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking@latest"
      ],
      "gallery": true,
      "autoStart": true
    }
  }
}
```

## 📖 Usage

### 📖 How It Works

1. **Configuration Reading**: The extension uses VSCode's API to intelligently locate your MCP configuration file, working in both local and remote environments
2. **Auto-Start Detection**: It looks for servers with `"autoStart": true` in their configuration
3. **Process Management**: Servers are started using VSCode's output panel, so they don't occupy terminal sessions
4. **Integration**: Started servers integrate with existing MCP commands like "MCP: List Servers" and "MCP: Stop Server"

### 🎛️ Commands

- **MCP-AutoStarter: Enable auto-start for currently running MCP servers** - Helps you enable auto-start for servers that are already running

### Extension Settings

- `mcpAutoStarter.enabled`: Enable/disable automatic starting of MCP servers (default: true)
- `mcpAutoStarter.retryAttempts`: Number of retry attempts when starting a server fails (default: 3)
- `mcpAutoStarter.retryDelay`: Delay in milliseconds between retry attempts (default: 2000)
- `mcpAutoStarter.configPath`: Custom path to the MCP configuration file. Leave empty to auto-detect. Useful for remote VSCode environments.

### 🌐 Remote VSCode Support

The extension uses VSCode's APIs to intelligently locate your MCP configuration, working seamlessly in all environments:

- **VSCode API-based**: Uses `globalStorageUri` and other VSCode APIs to derive the correct path
- **Smart path derivation**: Analyzes VSCode's directory structure to find the User config directory
- **Auto-detection**: Tries multiple possible paths to find your local MCP configuration
- **Custom path**: Set `mcpAutoStarter.configPath` in settings to specify exact location
- **Cross-platform**: Supports macOS, Windows, and Linux configuration paths
- **VSCode variants**: Works with both regular VSCode and VSCode Insiders

For remote environments, you may need to set the custom config path:
1. Open VSCode Settings (`Cmd/Ctrl + ,`)
2. Search for "MCP Auto-Starter"
3. Set "Config Path" to your local MCP configuration file path

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
