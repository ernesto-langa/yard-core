/**
 * workers/search.js
 * CLI command for searching workers/agents in the registry.
 *
 * @module cli/commands/workers/search
 * @version 1.0.0
 */

'use strict';

const { Command } = require('commander');
const { searchKeyword } = require('./search-keyword');
const { searchSemantic } = require('./search-semantic');
const { applyFilters } = require('./search-filters');
const { formatOutput, formatJSON } = require('../../utils/output-formatter-cli');
const { getRegistry } = require('../../../core/registry/registry-loader');

/**
 * Create the workers search subcommand
 * @returns {Command}
 */
function createSearchCommand() {
  const cmd = new Command('search');

  cmd
    .description('Search for workers/agents in the registry')
    .argument('<query>', 'Search query')
    .option('-c, --category <category>', 'Filter by category')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .option('--json', 'Output as JSON')
    .option('--semantic', 'Use semantic search (if available)')
    .option('--limit <n>', 'Maximum results', parseInt, 20)
    .action(async (query, options) => {
      try {
        const registry = getRegistry();
        await registry.load();
        const workers = await registry.getAll();

        let results;
        if (options.semantic) {
          results = await searchSemantic(workers, query);
        } else {
          results = searchKeyword(workers, query).map(r => ({
            ...r.worker,
            score: r.score,
            matchType: r.matchType,
          }));
        }

        // Apply filters
        const filters = {};
        if (options.category) filters.category = options.category;
        if (options.tags) filters.tags = options.tags.split(',').map(t => t.trim());

        results = applyFilters(results, filters);

        if (options.limit) {
          results = results.slice(0, options.limit);
        }

        if (options.json) {
          console.log(formatJSON(results));
        } else {
          console.log(formatOutput(results, { query }));
        }
      } catch (err) {
        console.error(`Search failed: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}

module.exports = { createSearchCommand };
