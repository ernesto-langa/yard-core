/**
 * cli/commands/mcp/setup.js
 * CLI command for initializing the global MCP configuration structure
 * at ~/.yard/.
 *
 * Steps:
 *   1. Directory creation: global dir + mcp/, servers/, cache/ subdirs
 *   2. Server configuration: optional templates via --with-defaults or --servers
 *   3. Config file generation: global-config.json with defaults
 *
 * @version 1.0.0
 */

'use strict';

const path = require('path');
const os = require('os');
const { Command } = require('commander');

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
 * Resolves the OS-specific global yard directory path.
 *
 * @returns {string}
 */
function getGlobalYardDir() {
  return path.join(os.homedir(), '.yard');
}

/**
 * Creates and returns the `yard mcp setup` command.
 *
 * @returns {Command}
 */
function createSetupCommand() {
  const cmd = new Command('setup')
    .description('Initialize the global MCP configuration at ~/.yard/')
    .option('--with-defaults', 'Include context7, exa, and github server templates')
    .option('--servers <names>', 'Comma-separated server template names to include')
    .option('-f, --force', 'Recreate existing configuration')
    .option('-v, --verbose', 'Show detailed output including available templates')
    .addHelpText(
      'after',
      `
Creates the global directory structure:
  ~/.yard/
  ├── mcp/
  │   └── global-config.json
  ├── servers/
  └── cache/

Default global-config.json settings:
  { "timeout": 30000, "retries": 3 }

Examples:
  $ yard mcp setup
  $ yard mcp setup --with-defaults
  $ yard mcp setup --servers context7,exa
  $ yard mcp setup --force

After setup:
  $ yard mcp link        # Link current project to global config
  $ yard mcp add <name>  # Add more servers
`
    )
    .action(async (options) => {
      await runSetup(options);
    });

  return cmd;
}

/**
 * Executes the setup command logic.
 *
 * @param {Object} options
 */
async function runSetup(options) {
  const manager = getGlobalConfigManager();
  const globalDir = getGlobalYardDir();

  if (manager.globalConfigExists() && !options.force) {
    console.log(`Global MCP configuration already exists at: ${globalDir}`);
    console.log('Use --force to recreate it.');
    return;
  }

  // Step 1: Create directory structure
  const dirs = [
    globalDir,
    path.join(globalDir, 'mcp'),
    path.join(globalDir, 'servers'),
    path.join(globalDir, 'cache'),
  ];

  for (const dir of dirs) {
    try {
      await manager.ensureDir(dir);
      if (options.verbose) console.log(`  Created: ${dir}`);
    } catch (err) {
      console.error(`Failed to create directory: ${dir}\n${err.message}`);
      process.exit(1);
    }
  }

  // Step 2: Determine servers to include
  let serverNames = [];
  if (options.withDefaults) {
    serverNames = ['context7', 'exa', 'github'];
  } else if (options.servers) {
    serverNames = options.servers.split(',').map((s) => s.trim()).filter(Boolean);
  }

  if (options.verbose && serverNames.length === 0) {
    const templates = manager.listTemplates();
    console.log('\nAvailable templates:');
    for (const t of templates) {
      console.log(`  ${t.name.padEnd(20)} ${t.type}`);
    }
  }

  // Step 3: Generate global-config.json
  const configPath = path.join(globalDir, 'mcp', 'global-config.json');
  const globalConfig = {
    version: '1.0.0',
    servers: {},
    defaults: {
      timeout: 30000,
      retries: 3,
    },
  };

  for (const name of serverNames) {
    try {
      const tmpl = manager.buildFromTemplate(name, { name });
      globalConfig.servers[name] = tmpl;
      if (options.verbose) console.log(`  Added server template: ${name}`);
    } catch (err) {
      console.error(`  Warning: template "${name}" not found — skipping.`);
    }
  }

  await manager.writeGlobalConfig(configPath, globalConfig);

  console.log(`\nGlobal MCP configuration initialized at: ${globalDir}`);
  console.log('\nNext steps:');
  console.log('  yard mcp link               Link current project to global config');
  console.log('  yard mcp add <name>         Add additional servers');
  console.log('  yard mcp status             Verify configuration');
}

module.exports = { createSetupCommand, runSetup };
