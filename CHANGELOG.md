# Changelog

All notable changes to the MCP Auto-Starter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-20

### Added
- 🚀 **Auto-start functionality** - Automatically start MCP servers when VSCode starts by reading MCP configuration
- 📝 **Simple configuration** - Just add `"autoStart": true` to your server config in mcp.json
- 📊 **Output panel integration** - Servers run in dedicated output channels, not terminal sessions
- 🔄 **Configuration watching** - Automatically detects changes to MCP configuration file
- ⚙️ **Configuration validation** - Validates server configurations before starting
- 🎯 **Stdio server support** - Currently supports stdio-type MCP servers
- 📝 **Comprehensive logging** - Detailed output channel with server status and logs
- 🛠️ **Process management** - Start, stop, and restart MCP server processes
- 🔍 **Auto-start detection** - Finds servers with autoStart enabled in configuration
- 🎨 **VSCode integration** - Integrates with existing MCP commands
- 🔧 **Command support** - Single command to enable auto-start for running servers
- 🛡️ **Error handling** - Robust error handling with user-friendly messages
- 🌐 **Multi-platform support** - Works on Windows, macOS, and Linux
- 🔗 **Remote VSCode support** - Automatically detects and handles remote environments (SSH, Codespaces, etc.)
- ⚙️ **Custom config path** - Option to specify custom MCP configuration file location
- 🔍 **Smart path detection** - Tries multiple possible paths to find existing configuration
- 📚 **Documentation** - Clear setup and usage instructions

### Technical Features
- TypeScript implementation with full type safety
- Modular architecture with separate configuration reader and process manager
- Event-driven design with proper cleanup and disposal
- Comprehensive error handling and logging
- Configuration validation and file watching
- VSCode API integration for output channels, commands, and configuration path detection
- Smart path derivation using VSCode's globalStorageUri and directory structure analysis

### Requirements
- VS Code 1.74.0 or higher
- Node.js 16.x or higher (for MCP servers)

### Known Issues
- Server health monitoring is basic and may not detect all failure modes
- Terminal-based servers don't have automatic restart on failure
- SSH authentication issues may prevent direct git operations

## [Unreleased]

### Planned Features
- VS Code Marketplace publication
- Enhanced health monitoring with custom health check endpoints
- Server dependency management and startup ordering
- Configuration templates for popular MCP servers
- Integration with VS Code's built-in terminal for better server management
- Advanced logging with log levels and filtering
- Server performance analytics and reporting
- Backup and sync of configurations across devices
