# Changelog

All notable changes to the MCP Auto-Starter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-19

### Added
- 🚀 **Auto-start functionality** - Automatically start MCP servers when VSCode starts
- 📊 **Tree view management** - Visual interface in Explorer sidebar showing all MCP servers
- 🔄 **Toggle auto-start** - Enable/disable auto-start for individual servers
- ⚡ **Manual server control** - Start, stop, and restart servers with one-click actions
- 💚 **Health monitoring** - Automatic failure detection and recovery mechanisms
- 📈 **Performance monitoring** - Detailed metrics and performance issue detection
- 🛠️ **Server configuration UI** - Easy add, edit, and remove servers through webview panels
- 🎯 **Multiple server types** - Support for stdio, HTTP, and SSE server configurations
- 📝 **Comprehensive logging** - Detailed output channel with structured logging
- ⚙️ **Configuration management** - Integration with VSCode settings with validation
- 🔧 **Settings management** - Backup, restore, and reset functionality for configurations
- 📊 **Server details view** - Detailed information panels for each server
- 🚨 **Error handling** - Robust error handling with user-friendly messages
- 🔄 **Automatic retries** - Intelligent retry logic for failed server starts
- 📋 **Context menus** - Right-click actions for server management
- 🎨 **Status indicators** - Visual status icons and tooltips
- 📦 **VSIX packaging** - Ready for distribution and installation

### Technical Features
- TypeScript implementation with full type safety
- Modular architecture with separate managers for different concerns
- Event-driven design with proper cleanup and disposal
- Comprehensive error handling and logging
- Performance monitoring and metrics collection
- Configuration validation and migration support
- Webview-based UI components with message passing
- GitHub Actions CI/CD pipeline for automated testing and releases

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
