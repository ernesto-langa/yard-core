/**
 * cli/commands/mcp/add.js
 * CLI command for managing MCP servers in the global configuration.
 *
 * Supports two connection types:
 *   SSE     - Server-Sent Events (requires --url)
 *   Command - Executes a local command with optional args and env vars
 *
 * @version 1.0.0
 */

'use strict';

const path = require('path');
const { Command } = require('commander');

// Lazy-loaded to avoid failures if global config doesn't exist yet
let globalConfigManager = null;
function getGlobalConfigManager() {
  if (!globalConfigManager) {
    globalConfigManager = require(
      path.join(__dirname, '../../../core/mcp/global-config-manager')
    );
  }
  return globalConfigManager;
}

/**
 * Creates and returns the `yard mcp add` command.
 *
 * @returns {Command}
 */
function createAddCommand() {
  const cmd = new Command('add')
    .description('Add or manage a server in the global MCP configuration')
    .argument('[name]', 'Server name or template name')
    .option('-t, --template <name>', 'Use a built-in server template')
    .option('--url <url>', 'SSE endpoint URL (for SSE-type servers)')
    .option('--command <cmd>', 'Command to execute (for command-type servers)')
    .option('--args <args>', 'Comma-separated command arguments')
    .option('--env <env>', 'Comma-separated KEY=VALUE environment variables')
    .option('--remove', 'Remove the specified server')
    .option('--enable', 'Enable the specified server')
    .option('--disable', 'Disable the specified server')
    .option('--list-templates', 'List available built-in server templates')
    .option('-v, --verbose', 'Show detailed output')
    .addHelpText(
      'after',
      `
Examples:
  # Add using a template
  $ yard mcp add context7 --template context7

  # Add custom SSE server
  $ yard mcp add myserver --url https://my-sse-server.example.com

  # Add custom command server
  $ yard mcp add localserver --command node --args server.js,--port,3100

  # Add with environment variables
  $ yard mcp add github --env GITHUB_TOKEN=ghp_xxx

  # Manage existing servers
  $ yard mcp add context7 --disable
  $ yard mcp add context7 --enable
  $ yard mcp add oldserver --remove

  # List templates
  $ yard mcp add --list-templates
`
    )
    .action(async (name, options) => {
      await runAdd(name, options);
    });

  return cmd;
}

/**
 * Executes the add command logic.
 *
 * @param {string|undefined} name
 * @param {Object} options
 */
async function runAdd(name, options) {
  const manager = getGlobalConfigManager();

  // Validate global config exists
  if (!manager.globalConfigExists()) {
    console.error('Global MCP configuration not found.');
    console.error('Run: yard mcp setup --with-defaults');
    process.exit(1);
  }

  // List templates
  if (options.listTemplates) {
    const templates = manager.listTemplates();
    console.log('\nAvailable server templates:\n');
    for (const tmpl of templates) {
      console.log(`  ${tmpl.name.padEnd(20)} ${tmpl.type.padEnd(10)} ${tmpl.description || ''}`);
      if (tmpl.requiredEnv && tmpl.requiredEnv.length > 0) {
        console.log(`  ${''.padEnd(20)} Requires: ${tmpl.requiredEnv.join(', ')}`);
      }
    }
    console.log('');
    return;
  }

  if (!name) {
    console.error('Server name is required. Use --list-templates to see available templates.');
    process.exit(1);
  }

  // Remove
  if (options.remove) {
    await manager.removeServer(name);
    console.log(`Server "${name}" removed from global configuration.`);
    return;
  }

  // Enable/Disable
  if (options.enable) {
    await manager.setServerEnabled(name, true);
    console.log(`Server "${name}" enabled.`);
    return;
  }
  if (options.disable) {
    await manager.setServerEnabled(name, false);
    console.log(`Server "${name}" disabled.`);
    return;
  }

  // Build server config
  let serverConfig;

  if (options.template) {
    serverConfig = manager.buildFromTemplate(options.template, { name, env: parseEnv(options.env) });
  } else if (options.url) {
    serverConfig = {
      type: 'sse',
      url: options.url,
      env: parseEnv(options.env),
    };
  } else if (options.command) {
    serverConfig = {
      type: 'command',
      command: options.command,
      args: options.args ? options.args.split(',') : [],
      env: parseEnv(options.env),
    };
  } else {
    console.error('Specify --template, --url, or --command to define the server.');
    process.exit(1);
  }

  await manager.addServer(name, serverConfig, { verbose: options.verbose });

  const configPath = manager.getGlobalConfigPath();
  console.log(`Server "${name}" added successfully.`);
  if (options.verbose) {
    console.log(`Configuration: ${configPath}`);
    console.log(JSON.stringify(serverConfig, null, 2));
  }
}

/**
 * Parses "KEY=VALUE,KEY2=VALUE2" into an object.
 *
 * @param {string|undefined} envStr
 * @returns {Object}
 */
function parseEnv(envStr) {
  if (!envStr) return {};
  return Object.fromEntries(
    envStr.split(',').map((pair) => {
      const idx = pair.indexOf('=');
      return idx >= 0 ? [pair.slice(0, idx), pair.slice(idx + 1)] : [pair, ''];
    })
  );
}

module.exports = { createAddCommand, runAdd };
