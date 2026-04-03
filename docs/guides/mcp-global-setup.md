# YARD MCP Global Setup Guide

> **EN** | [PT](../pt/guides/mcp-global-setup.md) | [ES](../es/guides/mcp-global-setup.md)

---

> Configure global MCP (Model Context Protocol) servers for YARD-Framework.

**Version:** 2.1.1
**Last Updated:** 2025-12-23

---

## Overview

The MCP Global System allows you to configure MCP servers once and share them across all YARD projects. This eliminates the need to configure the same servers in every project.

### Benefits

| Benefit                   | Description                             |
| ------------------------- | --------------------------------------- |
| **Single Configuration**  | Configure servers once, use everywhere  |
| **Consistent Settings**   | Same server configs across all projects |
| **Credential Management** | Secure, centralized credential storage  |
| **Easy Updates**          | Update server versions in one place     |

### Global Directory Structure

```
~/.yard/
├── mcp/
│   ├── global-config.json    # Main configuration file
│   ├── servers/              # Individual server configs
│   │   ├── context7.json
│   │   ├── exa.json
│   │   └── github.json
│   └── cache/                # Server response cache
└── credentials/              # Secure credential storage
    └── .gitignore            # Prevents accidental commits
```

### Recommended Architecture

Based on production configurations, the recommended MCP setup uses two layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    ~/.claude.json                            │
│                   (User MCPs - Direct)                       │
├─────────────────────────────────────────────────────────────┤
│  desktop-commander  │ Persistent sessions, REPL, fuzzy edit │
│  docker-gateway     │ Gateway for containerized MCPs        │
│  playwright         │ Browser automation                    │
│  n8n-mcp           │ Workflow automation (optional)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              docker-gateway (58+ tools)                      │
│            (MCPs inside Docker - No token cost)              │
├─────────────────────────────────────────────────────────────┤
│  Apify        │ Web scraping, social media extraction       │
│  Context7     │ Library documentation lookup                │
│  EXA          │ Web search and research                     │
│  + others     │ Any MCP that runs in containers             │
└─────────────────────────────────────────────────────────────┘
```

**Why this architecture?**

| MCP Location                 | Token Cost        | Use Case                                     |
| ---------------------------- | ----------------- | -------------------------------------------- |
| **Direct in ~/.claude.json** | Normal            | MCPs that need host access (files, terminal) |
| **Inside docker-gateway**    | **No extra cost** | MCPs that don't need host access (APIs, web) |

MCPs running inside docker-gateway are encapsulated in containers, so their tool definitions don't add overhead to the Claude conversation context.

---

## Platform-Specific Paths

### Windows

```
C:\Users\<username>\.yard\mcp\global-config.json
C:\Users\<username>\.yard\mcp\servers\
C:\Users\<username>\.yard\credentials\
```

### macOS

```
/Users/<username>/.yard/mcp/global-config.json
/Users/<username>/.yard/mcp/servers/
/Users/<username>/.yard/credentials/
```

### Linux

```
/home/<username>/.yard/mcp/global-config.json
/home/<username>/.yard/mcp/servers/
/home/<username>/.yard/credentials/
```

---

## Initial Setup

### Step 1: Create Global Structure

```bash
# Create global directory and config
yard mcp setup
```

**This creates:**

- `~/.yard/` - Global YARD directory
- `~/.yard/mcp/` - MCP configuration directory
- `~/.yard/mcp/global-config.json` - Main config file
- `~/.yard/mcp/servers/` - Individual server configs
- `~/.yard/mcp/cache/` - Response cache
- `~/.yard/credentials/` - Secure credential storage

### Step 2: Verify Setup

```bash
# Check global config exists
yard mcp status
```

**Expected Output:**

```
MCP Global Configuration
========================

Location: ~/.yard/mcp/global-config.json
Status:   ✓ Configured

Servers: 0 configured
Cache:   Empty

Run 'yard mcp add <server>' to add servers.
```

---

## Adding MCP Servers

### Using Templates

YARD includes templates for popular MCP servers:

```bash
# Add from template
yard mcp add context7
yard mcp add exa
yard mcp add github
yard mcp add puppeteer
yard mcp add filesystem
yard mcp add memory
yard mcp add desktop-commander
```

### Available Templates

| Template            | Type    | Description                   |
| ------------------- | ------- | ----------------------------- |
| `context7`          | SSE     | Library documentation lookups |
| `exa`               | Command | Advanced web search           |
| `github`            | Command | GitHub API integration        |
| `puppeteer`         | Command | Browser automation            |
| `filesystem`        | Command | File system access            |
| `memory`            | Command | Temporary memory storage      |
| `desktop-commander` | Command | Desktop automation            |

### Custom Server Configuration

```bash
# Add custom server with JSON config
yard mcp add my-server --config='{"command":"npx","args":["-y","my-mcp-server"]}'

# Add from config file
yard mcp add my-server --config-file=./my-server-config.json
```

---

## CLI Commands

### `yard mcp setup`

Initialize global MCP configuration.

```bash
# Create global structure
yard mcp setup

# Force recreate (backup existing)
yard mcp setup --force

# Specify custom location
yard mcp setup --path=/custom/path
```

### `yard mcp add`

Add a new MCP server.

```bash
# Add from template
yard mcp add context7

# Add with custom config
yard mcp add custom-server --config='{"command":"npx","args":["-y","package"]}'

# Add with environment variables
yard mcp add exa --env='EXA_API_KEY=your-key'
```

### `yard mcp remove`

Remove an MCP server.

```bash
# Remove server
yard mcp remove context7

# Remove with confirmation skip
yard mcp remove context7 --yes
```

### `yard mcp list`

List configured servers.

```bash
# List all servers
yard mcp list

# List with details
yard mcp list --verbose

# List only enabled
yard mcp list --enabled
```

**Output:**

```
Configured MCP Servers
======================

  context7     [enabled]  SSE  https://mcp.context7.com/sse
  exa          [enabled]  CMD  npx -y exa-mcp-server
  github       [disabled] CMD  npx -y @modelcontextprotocol/server-github

Total: 3 servers (2 enabled, 1 disabled)
```

### `yard mcp enable/disable`

Enable or disable servers.

```bash
# Disable server
yard mcp disable github

# Enable server
yard mcp enable github

# Toggle
yard mcp toggle github
```

### `yard mcp status`

Show global MCP status.

```bash
# Full status
yard mcp status

# JSON output
yard mcp status --json
```

### `yard mcp sync`

Sync global config to project.

```bash
# Sync to current project
yard mcp sync

# Sync specific servers only
yard mcp sync --servers=context7,exa
```

---

## Configuration Files

### global-config.json

Main configuration file with all server definitions.

```json
{
  "version": "1.0",
  "servers": {
    "context7": {
      "type": "sse",
      "url": "https://mcp.context7.com/sse",
      "enabled": true
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      },
      "enabled": true
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "enabled": true
    }
  },
  "defaults": {
    "timeout": 30000,
    "retries": 3
  }
}
```

### Individual Server Files

Each server also has its own config file in `servers/`:

```json
// ~/.yard/mcp/servers/context7.json
{
  "type": "sse",
  "url": "https://mcp.context7.com/sse",
  "enabled": true
}
```

---

## Server Types

### SSE (Server-Sent Events)

For servers that provide a streaming HTTP endpoint.

```json
{
  "type": "sse",
  "url": "https://mcp.server.com/sse",
  "enabled": true
}
```

### Command

For servers that run as local processes.

```json
{
  "command": "npx",
  "args": ["-y", "@package/mcp-server"],
  "env": {
    "API_KEY": "${API_KEY}"
  },
  "enabled": true
}
```

### Windows Command Wrapper

For Windows, use the CMD wrapper for NPX:

```json
{
  "command": "cmd",
  "args": ["/c", "npx-wrapper.cmd", "-y", "@package/mcp-server"],
  "env": {
    "API_KEY": "${API_KEY}"
  },
  "enabled": true
}
```

---

## Environment Variables

### Using Variables in Config

Reference environment variables using `${VAR_NAME}` syntax:

```json
{
  "env": {
    "API_KEY": "${MY_API_KEY}",
    "TOKEN": "${MY_TOKEN}"
  }
}
```

### Setting Variables

**Windows (PowerShell):**

```powershell
$env:EXA_API_KEY = "your-api-key"
$env:GITHUB_TOKEN = "your-github-token"
```

**Windows (CMD):**

```cmd
set EXA_API_KEY=your-api-key
set GITHUB_TOKEN=your-github-token
```

**macOS/Linux:**

```bash
export EXA_API_KEY="your-api-key"
export GITHUB_TOKEN="your-github-token"
```

### Persistent Variables

**Windows:** Add to System Environment Variables

**macOS/Linux:** Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`:

```bash
export EXA_API_KEY="your-api-key"
export GITHUB_TOKEN="your-github-token"
```

---

## Credential Management

### Secure Storage

Credentials are stored in `~/.yard/credentials/` with a `.gitignore` to prevent accidental commits.

```bash
# Add credential
yard mcp credential set EXA_API_KEY "your-api-key"

# Get credential
yard mcp credential get EXA_API_KEY

# List credentials (masked)
yard mcp credential list
```

### Credential File Format

```json
// ~/.yard/credentials/api-keys.json
{
  "EXA_API_KEY": "encrypted-value",
  "GITHUB_TOKEN": "encrypted-value"
}
```

---

## Programmatic Usage

### JavaScript API

```javascript
const {
  globalDirExists,
  globalConfigExists,
  createGlobalStructure,
  readGlobalConfig,
  addServer,
  removeServer,
  listServers,
} = require('./.yard-core/core/mcp/global-config-manager');

// Check if setup exists
if (!globalDirExists()) {
  createGlobalStructure();
}

// Add server
addServer('my-server', {
  command: 'npx',
  args: ['-y', 'my-mcp-server'],
  enabled: true,
});

// List servers
const { servers, total, enabled } = listServers();
console.log(`${enabled}/${total} servers enabled`);

// Remove server
removeServer('my-server');
```

### OS Detection

```javascript
const {
  detectOS,
  isWindows,
  isMacOS,
  isLinux,
  getGlobalMcpDir,
  getGlobalConfigPath,
} = require('./.yard-core/core/mcp/os-detector');

// Get OS type
console.log(detectOS()); // 'windows' | 'macos' | 'linux'

// Get paths
console.log(getGlobalMcpDir()); // ~/.yard/mcp/
console.log(getGlobalConfigPath()); // ~/.yard/mcp/global-config.json
```

---

## Troubleshooting

### Setup Issues

| Issue             | Solution                                                          |
| ----------------- | ----------------------------------------------------------------- |
| Permission denied | Run terminal as Administrator (Windows) or use sudo (macOS/Linux) |
| Directory exists  | Use `yard mcp setup --force` to recreate                          |
| Path not found    | Ensure home directory exists                                      |

### Server Issues

| Issue                          | Solution                                         |
| ------------------------------ | ------------------------------------------------ |
| Server not starting            | Check command and args, verify package installed |
| Environment variable not found | Set variable or use credentials storage          |
| Timeout errors                 | Increase timeout in config                       |
| Connection refused             | Check URL and network access                     |

### Windows-Specific Issues

| Issue          | Solution                               |
| -------------- | -------------------------------------- |
| NPX not found  | Add Node.js to PATH, use CMD wrapper   |
| Symlink errors | Enable Developer Mode or use junctions |
| Path too long  | Enable long paths in registry          |

### Common Fixes

```bash
# Reset global config
yard mcp setup --force

# Clear cache
rm -rf ~/.yard/mcp/cache/*

# Verify config
yard mcp status --verbose

# Test server manually
npx -y @modelcontextprotocol/server-github
```

### Docker MCP Toolkit Issues

| Issue                            | Solution                                  |
| -------------------------------- | ----------------------------------------- |
| Secrets not passed to containers | Edit catalog file directly (see below)    |
| Template interpolation failing   | Use hardcoded values in catalog           |
| Tools showing as "(N prompts)"   | Token not being passed - apply workaround |

#### Docker MCP Secrets Bug (Dec 2025)

**Issue:** Docker MCP Toolkit's secrets store (`docker mcp secret set`) and template interpolation (`{{...}}`) do NOT work properly. Credentials are not passed to containers.

**Symptoms:**

- `docker mcp tools ls` shows "(N prompts)" instead of "(N tools)"
- MCP server starts but fails authentication
- Verbose output shows `-e ENV_VAR` without values

**Workaround:** Edit `~/.docker/mcp/catalogs/docker-mcp.yaml` directly:

```yaml
{ mcp-name }:
  env:
    - name: API_TOKEN
      value: 'actual-token-value-here'
```

**Example - Apify:**

```yaml
apify-mcp-server:
  env:
    - name: TOOLS
      value: 'actors,docs,apify/rag-web-browser'
    - name: APIFY_TOKEN
      value: 'apify_api_xxxxxxxxxxxxx'
```

**Note:** This exposes credentials in a local file. Secure file permissions and never commit this file.

---

## Integration with IDE

### Claude Desktop

Add to Claude Desktop settings:

```json
{
  "mcpServers": {
    "yard-global": {
      "command": "yard",
      "args": ["mcp", "serve", "--global"]
    }
  }
}
```

### VS Code

Configure in `.vscode/settings.json`:

```json
{
  "yard.mcp.useGlobal": true,
  "yard.mcp.globalPath": "~/.yard/mcp/global-config.json"
}
```

### Project-Specific Override

Create `.mcp.json` in project root to override global settings:

```json
{
  "inherit": "global",
  "servers": {
    "context7": {
      "enabled": false
    },
    "project-specific": {
      "command": "node",
      "args": ["./local-mcp-server.js"]
    }
  }
}
```

---

## Best Practices

1. **Use templates** for common servers
2. **Store credentials securely** in credentials directory
3. **Disable unused servers** to reduce resource usage
4. **Keep servers updated** with latest package versions
5. **Use project overrides** for project-specific needs
6. **Back up config** before major changes

---

## Related Documentation

- [Docker Gateway Tutorial](./mcp/docker-gateway-tutorial.md)
- [Desktop Commander MCP Guide](./mcp/desktop-commander.md)
- [Docker MCP Setup](../docker-mcp-setup.md)
- [Module System Architecture](../architecture/module-system.md)
- [MCP Architecture Diagrams](../architecture/mcp-system-diagrams.md)

---

_YARD-Framework v4 MCP Global Setup Guide_
