/**
 * workers/list.js
 * CLI command for listing workers/agents in the registry.
 *
 * @module cli/commands/workers/list
 * @version 1.0.0
 */

'use strict';

const { Command } = require('commander');
const { getRegistry } = require('../../../core/registry/registry-loader');
const { formatTable: formatListTable } = require('./formatters/list-table');
const { formatTree: formatListTree } = require('./formatters/list-tree');

/**
 * Create the workers list subcommand
 * @returns {Command}
 */
function createListCommand() {
  const cmd = new Command('list');

  cmd
    .description('List all available workers/agents in the registry')
    .option('-c, --category <category>', 'Filter by category')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .option('--tree', 'Display as tree view')
    .option('--json', 'Output as JSON')
    .option('--limit <n>', 'Maximum results', parseInt, 50)
    .action(async (options) => {
      try {
        const registry = getRegistry();
        await registry.load();
        let workers = await registry.getAll();

        // Apply filters
        if (options.category) {
          const cat = options.category.toLowerCase();
          workers = workers.filter(w => (w.category || '').toLowerCase() === cat);
        }

        if (options.tags) {
          const tags = options.tags.split(',').map(t => t.trim().toLowerCase());
          workers = workers.filter(w => {
            const wTags = Array.isArray(w.tags) ? w.tags.map(t => t.toLowerCase()) : [];
            return tags.some(t => wTags.includes(t));
          });
        }

        if (options.limit) {
          workers = workers.slice(0, options.limit);
        }

        if (options.json) {
          console.log(JSON.stringify(workers, null, 2));
        } else if (options.tree) {
          console.log(formatListTree(workers));
        } else {
          console.log(formatListTable(workers));
        }
      } catch (err) {
        console.error(`List failed: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}

module.exports = { createListCommand };
