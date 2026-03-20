/**
 * cli/commands/mcp/status.js
 * CLI command that displays the configuration status of the MCP system,
 * both globally and per-project.
 *
 * Link status states:
 *   Linked        - Project connected to global config
 *   Not linked    - Project has no connection established
 *   Broken link   - Link target is invalid or missing
 *   Local dir     - Project uses local config instead of global
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
 * Creates and returns the `yard mcp status` command.
 *
 * @returns {Command}
 */
function createStatusCommand() {
  const cmd = new Command('status')
    .description('Display MCP configuration status (global and project)')
    .option('--json', 'Output status data in JSON format')
    .option('-v, --verbose', 'Show detailed server information and system details')
    .action(async (options) => {
      await runStatus(options);
    });

  return cmd;
}

/**
 * Executes the status command logic.
 *
 * @param {Object} options
 */
async function runStatus(options) {
  const manager = getGlobalConfigManager();
  const cwd = process.cwd();
  const globalDir = path.join(os.homedir(), '.yard');

  // Gather status data
  const globalExists = manager.globalConfigExists();
  const globalConfig = globalExists ? await manager.loadGlobalConfig() : null;
  const linkStatus = await manager.getProjectLinkStatus(cwd);
  const servers = globalConfig ? globalConfig.servers || {} : {};

  const status = {
    global: {
      exists: globalExists,
      path: path.join(globalDir, 'mcp', 'global-config.json'),
      version: globalConfig?.version || null,
      serverCount: Object.keys(servers).length,
    },
    project: {
      path: cwd,
      linkStatus: linkStatus.state,
      linkPath: linkStatus.linkPath || null,
    },
    servers: Object.entries(servers).map(([name, config]) => ({
      name,
      type: config.type,
      enabled: config.enabled !== false,
    })),
  };

  if (options.verbose) {
    status.system = {
      os: os.type(),
      arch: os.arch(),
      linkType: process.platform === 'win32' ? 'junction' : 'symlink',
    };
  }

  // JSON output
  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  // Pretty output
  console.log('\nYARD MCP Status\n' + '─'.repeat(50));

  // Global
  console.log('\nGlobal Configuration:');
  if (globalExists) {
    console.log(`  Path:    ${status.global.path}`);
    console.log(`  Version: ${status.global.version || 'unknown'}`);
    console.log(`  Servers: ${status.global.serverCount}`);
  } else {
    console.log('  Not configured.');
    console.log('  Run: yard mcp setup --with-defaults');
  }

  // Project link
  console.log('\nProject Link:');
  const linkLabels = {
    linked: '  Linked to global',
    not_linked: '  Not linked',
    broken: '  Broken link',
    local_directory: '  Local directory (not using global)',
  };
  console.log(linkLabels[linkStatus.state] || `  ${linkStatus.state}`);

  if (linkStatus.state === 'not_linked') {
    console.log('  Run: yard mcp link');
  } else if (linkStatus.state === 'broken') {
    console.log('  Run: yard mcp link --force to repair');
  }

  // Servers
  if (status.servers.length > 0) {
    console.log('\nConfigured Servers:');
    for (const s of status.servers) {
      const enabledMark = s.enabled ? 'enabled ' : 'disabled';
      console.log(`  ${s.name.padEnd(20)} ${s.type.padEnd(10)} [${enabledMark}]`);
    }
  }

  // System (verbose)
  if (options.verbose && status.system) {
    console.log('\nSystem:');
    console.log(`  OS:        ${status.system.os} (${status.system.arch})`);
    console.log(`  Link type: ${status.system.linkType}`);
  }

  console.log('');
}

module.exports = { createStatusCommand, runStatus };
