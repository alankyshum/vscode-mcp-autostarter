# Advanced Usage Guide

This guide covers advanced features and configuration options for the MCP Auto-Starter extension.

## 🔧 Advanced Configuration

### Server Types

The extension supports three types of MCP servers:

#### 1. Standard I/O (stdio) Servers
Command-based servers that communicate through stdin/stdout.

```json
{
  "my-stdio-server": {
    "name": "My Node.js MCP Server",
    "type": "stdio",
    "command": "node",
    "args": ["dist/index.js", "--verbose"],
    "cwd": "/path/to/server",
    "env": {
      "NODE_ENV": "production",
      "PORT": "3000"
    },
    "autoStart": true,
    "enabled": true
  }
}
```

#### 2. HTTP Servers
REST API-based servers accessible via HTTP.

```json
{
  "my-http-server": {
    "name": "My HTTP MCP Server",
    "type": "http",
    "url": "http://localhost:3000/mcp",
    "autoStart": false,
    "enabled": true
  }
}
```

#### 3. Server-Sent Events (SSE) Servers
Event-driven servers using SSE for real-time communication.

```json
{
  "my-sse-server": {
    "name": "My SSE MCP Server",
    "type": "sse",
    "url": "http://localhost:3001/events",
    "autoStart": true,
    "enabled": true
  }
}
```

## 📊 Performance Monitoring

### Viewing Performance Metrics

Access detailed performance information:

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `MCP Auto-Starter: Show Performance Metrics`

The performance panel shows:
- Extension uptime
- Memory usage
- Server start times
- Command execution statistics
- Performance issues and recommendations

### Performance Optimization Tips

1. **Limit concurrent servers**: Avoid running too many servers simultaneously
2. **Monitor memory usage**: Check for memory leaks in long-running servers
3. **Optimize startup time**: Use faster commands and reduce dependencies
4. **Health check frequency**: Adjust monitoring intervals if needed

## 🔄 Settings Management

### Export Settings

Save your current configuration:

```bash
Command Palette > MCP Auto-Starter: Export Settings
```

Creates a JSON file with:
- All server configurations
- Global settings
- Metadata (versions, platform info)

### Import Settings

Load configuration from a file:

```bash
Command Palette > MCP Auto-Starter: Import Settings
```

Options:
- **Import**: Replace all current settings
- **Merge**: Add to existing settings

### Backup and Restore

Create automatic backups:

```bash
Command Palette > MCP Auto-Starter: Create Backup
```

Reset to defaults:

```bash
Command Palette > MCP Auto-Starter: Reset Settings
```

## 🏥 Health Monitoring

### Automatic Health Checks

The extension performs health checks every 30 seconds:

- **stdio servers**: Monitors task execution status
- **HTTP/SSE servers**: Validates URL accessibility
- **All servers**: Tracks process lifecycle

### Retry Logic

Failed servers are automatically restarted:

- **Maximum retries**: 3 attempts
- **Retry delay**: 2 seconds between attempts
- **Backoff strategy**: Linear delay
- **Manual reset**: Retry count resets on successful manual start

### Health Status Indicators

- 🟢 **Running**: Server is healthy and responsive
- 🟡 **Starting**: Server is being initialized
- 🔴 **Error**: Server failed and exceeded retry limit
- ⚫ **Stopped**: Server is intentionally stopped
- 🔄 **Stopping**: Server is being terminated

## 🛠️ Advanced Server Configuration

### Environment Variables

Set environment variables for stdio servers:

```json
{
  "env": {
    "NODE_ENV": "production",
    "DEBUG": "mcp:*",
    "API_KEY": "your-api-key",
    "DATABASE_URL": "postgresql://..."
  }
}
```

### Working Directory

Specify the working directory for commands:

```json
{
  "cwd": "/path/to/server/directory"
}
```

### Command Arguments

Pass arguments to your server command:

```json
{
  "args": ["--port", "3000", "--verbose", "--config", "production.json"]
}
```

## 🔍 Troubleshooting

### Common Issues

#### Server Won't Start

1. Check command path and arguments
2. Verify working directory exists
3. Ensure environment variables are correct
4. Check VSCode output channel for errors

#### High Memory Usage

1. Monitor server processes
2. Check for memory leaks in server code
3. Restart problematic servers
4. Reduce number of concurrent servers

#### Slow Performance

1. Review performance metrics
2. Optimize server startup commands
3. Reduce health check frequency
4. Check system resources

### Debug Mode

Enable detailed logging:

1. Open VSCode settings
2. Search for "MCP Auto-Starter"
3. Enable debug logging
4. Check output channel for detailed information

### Log Analysis

The output channel provides detailed information:

- `[INFO]`: General information
- `[WARN]`: Warnings and potential issues
- `[ERROR]`: Errors and failures
- `[PERF]`: Performance metrics
- `[DEBUG]`: Detailed debugging information

## 🔧 Configuration Examples

### Development Setup

```json
{
  "mcp": {
    "servers": {
      "dev-server": {
        "name": "Development Server",
        "type": "stdio",
        "command": "npm",
        "args": ["run", "dev"],
        "cwd": "${workspaceFolder}/server",
        "env": {
          "NODE_ENV": "development",
          "DEBUG": "*"
        },
        "autoStart": true,
        "enabled": true
      }
    }
  },
  "mcpAutoStarter": {
    "globalAutoStart": true
  }
}
```

### Production Setup

```json
{
  "mcp": {
    "servers": {
      "prod-server": {
        "name": "Production Server",
        "type": "http",
        "url": "https://api.example.com/mcp",
        "autoStart": true,
        "enabled": true
      }
    }
  },
  "mcpAutoStarter": {
    "globalAutoStart": true
  }
}
```

### Multi-Server Setup

```json
{
  "mcp": {
    "servers": {
      "auth-server": {
        "name": "Authentication Server",
        "type": "stdio",
        "command": "python",
        "args": ["auth_server.py"],
        "autoStart": true,
        "enabled": true
      },
      "data-server": {
        "name": "Data Processing Server",
        "type": "http",
        "url": "http://localhost:8080/api",
        "autoStart": true,
        "enabled": true
      },
      "notification-server": {
        "name": "Notification Server",
        "type": "sse",
        "url": "http://localhost:9000/events",
        "autoStart": false,
        "enabled": true
      }
    }
  }
}
```

## 🚀 Best Practices

1. **Use descriptive names**: Make server identification easy
2. **Group related servers**: Use consistent naming conventions
3. **Test configurations**: Use the test feature before saving
4. **Monitor performance**: Regular check performance metrics
5. **Backup settings**: Export settings before major changes
6. **Document configurations**: Add comments in your settings files
7. **Use environment variables**: Keep sensitive data secure
8. **Regular maintenance**: Restart servers periodically for health
