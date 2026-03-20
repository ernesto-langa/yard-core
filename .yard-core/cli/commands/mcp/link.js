/**
 * cli/commands/mcp/link.js
 * CLI command for managing symlinks/junctions between project-level
 * and global MCP configurations.
 *
 * Operations:
 *   Link creation  - Connect project to global MCP config
 *   Unlinking      - Remove connection, restore project independence
 *   Migration      - Move project-level configs to global storage
 *   Merging        - Combine project and global configurations
 *
 * @version 1.0.0
 */

'use strict';

const path = require('path');
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
 * Creates and returns the `yard mcp link` command.
 *
 * @returns {Command}
 */
function createLinkCommand() {
  const cmd = new Command('link')
    .description('Link current project to global MCP configuration')
    .option('-f, --force', 'Overwrite existing link')
    .option('--migrate', 'Transfer project config to global scope before linking')
    .option('--merge', 'Combine project and global configurations')
    .option('--unlink', 'Remove the global connection (restore project independence)')
    .option('-v, --verbose', 'Show detailed operational information')
    .addHelpText(
      'after',
      `
Examples:
  $ yard mcp link                  # Link project to global config
  $ yard mcp link --force          # Overwrite existing link
  $ yard mcp link --migrate        # Move project config to global, then link
  $ yard mcp link --merge          # Merge project + global configs
  $ yard mcp link --unlink         # Remove global connection
`
    )
    .action(async (options) => {
      await runLink(options);
    });

  return cmd;
}

/**
 * Executes the link command logic.
 *
 * @param {Object} options
 */
async function runLink(options) {
  const manager = getGlobalConfigManager();
  const cwd = process.cwd();

  // Unlink
  if (options.unlink) {
    await manager.unlinkProject(cwd, { verbose: options.verbose });
    console.log('Project unlinked from global MCP configuration.');
    return;
  }

  // Ensure global config exists
  if (!manager.globalConfigExists()) {
    console.log('Global config not found — creating with defaults...');
    await manager.initGlobalConfig({ withDefaults: false });
  }

  // Analyze migration scenario
  const scenario = await manager.analyzeLinkScenario(cwd, { verbose: options.verbose });

  if (options.verbose) {
    console.log(`Scenario: ${scenario.type}`);
    if (scenario.projectConfigPath) {
      console.log(`Project config: ${scenario.projectConfigPath}`);
    }
  }

  // Handle migration
  if (options.migrate && scenario.projectConfigPath) {
    await manager.migrateProjectToGlobal(scenario.projectConfigPath, { verbose: options.verbose });
    console.log('Project configuration migrated to global scope.');
  }

  // Handle merge
  if (options.merge) {
    await manager.mergeProjectWithGlobal(cwd, { verbose: options.verbose });
    console.log('Project and global configurations merged.');
  }

  // Handle existing project config directory
  if (scenario.hasLocalDirectory && !options.force) {
    console.error(
      'Project already has a local MCP config directory.\n' +
        'Use --migrate to move it to global, --merge to combine, or --force to overwrite.'
    );
    process.exit(1);
  }

  // Create symlink or junction
  const linkResult = await manager.createProjectLink(cwd, {
    force: options.force,
    verbose: options.verbose,
  });

  if (linkResult.backupPath) {
    console.log(`Backup created: ${linkResult.backupPath}`);
  }

  console.log(`Project linked to global MCP configuration.`);
  if (options.verbose) {
    console.log(`Link type: ${linkResult.linkType}`);
    console.log(`Link path: ${linkResult.linkPath}`);
    console.log(`Target:    ${linkResult.targetPath}`);
  }
}

module.exports = { createLinkCommand, runLink };
