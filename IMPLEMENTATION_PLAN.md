# VSCode MCP Auto-Starter Extension Implementation Plan

## Overview

As of now, users can configure MCP server in their MCP configurations using "MCP: Open User Configuration".
This VsCode MCP auto-starter aims to support per-server level auto-start by reading that user configuration.
It's achieved by supporting a new configuration setting in the MCP configuration file, called "autoStart: boolean"

For example, it will read the new field in the mcp.json

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
      "autoStart": true // it will read this field
    }
  }
}
```

If `autoStart` is set to true, the extension will run the mcp server using the output panel, so it doesn't occupy terminal sessions.

## User flow

1. User start vscode
2. AutoStarter extension reads users' MCP configurations file and check each server's `autoStart` setting
3. Start the corresponding MCP server using the output panel
4. If the MCP server is already running, it will not start a new instance

## Key requirements
- if the MCP server is started by the extension, when user run the command "MCP: List Servers", the MCP server should be shown as running
- That should also mean the user can stop the MCP server using the command "MCP: Stop Server"
- This extension should not have any UI, it will only expose 1 commands
  - "MCP-AutoStarter: Enable auto-start for currently running MCP servers"