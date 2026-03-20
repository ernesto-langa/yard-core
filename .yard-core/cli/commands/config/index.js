/**
 * cli/commands/config/index.js
 * CLI commands for managing the layered configuration system.
 * Based on ADR-PRO-002.
 *
 * Subcommands:
 *   show       - Display resolved configuration
 *   diff       - Compare configurations between two levels
 *   migrate    - Transform monolithic core-config.yaml to layered structure
 *   validate   - Check YAML syntax across all config files
 *   init-local - Generate machine-specific configuration file
 *
 * @version 1.1.0
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { Command } = require('commander');

// Load config-utils from the framework's own location (relative to this file)
const CONFIG_UTILS_PATH = path.resolve(__dirname, '../../../core/config/config-utils');
const configUtils = require(CONFIG_UTILS_PATH);
function getConfigUtils() {
  return configUtils;
}

/**
 * Creates and returns the `yard config` command.
 *
 * @returns {Command}
 */
function createConfigCommand() {
  const cmd = new Command('config').description('Manage YARD layered configuration');

  // ─── show ──────────────────────────────────────────────────────────────────
  cmd
    .command('show')
    .description('Show resolved configuration')
    .option('-l, --level <level>', 'Show specific level (L1|L2|L3|L4|framework|project|local)')
    .option('-d, --debug', 'Show source annotations for each value')
    .action(async (options) => {
      const projectRoot = process.cwd();
      const utils = getConfigUtils();
      const config = await utils.resolveConfig({ level: options.level, projectRoot });

      if (options.debug) {
        // Show config with source annotations (L1, L2, etc.)
        const result = await utils.resolveConfig({ projectRoot, debug: true });
        const sources = result.sources || {};
        console.log(JSON.stringify({ config: result.config || config, sources }, null, 2));
      } else {
        console.log(JSON.stringify({ config }, null, 2));
      }
    });

  // ─── diff ──────────────────────────────────────────────────────────────────
  cmd
    .command('diff')
    .description('Compare configuration between two levels')
    .option('--levels <levels>', 'Comma-separated level pair, e.g. L1,L2')
    .action(async (options) => {
      const projectRoot = process.cwd();
      const utils = getConfigUtils();

      let levelA, levelB;
      if (options.levels) {
        [levelA, levelB] = options.levels.split(',').map(l => l.trim());
      } else {
        levelA = 'L1';
        levelB = 'L2';
      }

      const diff = await utils.diffLevels(levelA, levelB, projectRoot);

      if (diff.additions.length === 0 && diff.removals.length === 0 && diff.changes.length === 0) {
        console.log('No differences found.');
        return;
      }

      if (diff.additions.length > 0) {
        console.log(`\nAdditions (${levelB} only):`);
        diff.additions.forEach((k) => console.log(`  + ${k}`));
      }
      if (diff.removals.length > 0) {
        console.log(`\nRemovals (${levelA} only):`);
        diff.removals.forEach((k) => console.log(`  - ${k}`));
      }
      if (diff.changes.length > 0) {
        console.log('\nChanges:');
        diff.changes.forEach(({ key, from, to }) =>
          console.log(`  ~ ${key}: ${JSON.stringify(from)} → ${JSON.stringify(to)}`)
        );
      }
    });

  // ─── migrate ───────────────────────────────────────────────────────────────
  cmd
    .command('migrate')
    .description('Migrate monolithic core-config.yaml to layered structure')
    .option('--dry-run', 'Preview changes without writing files')
    .action(async (options) => {
      const projectRoot = process.cwd();
      const aioxDir = path.join(projectRoot, '.yard-core');
      const legacyPath = path.join(aioxDir, 'core-config.yaml');

      // Check if already layered
      const frameworkPath = path.join(aioxDir, 'framework-config.yaml');
      const projectConfigPath = path.join(aioxDir, 'project-config.yaml');

      if (fs.existsSync(frameworkPath) && fs.existsSync(projectConfigPath)) {
        console.log('Nothing to migrate. Config is already using layered structure.');
        return;
      }

      if (!fs.existsSync(legacyPath)) {
        console.log('Nothing to migrate. No core-config.yaml found.');
        return;
      }

      const utils = getConfigUtils();
      const plan = await utils.buildMigrationPlan(legacyPath);

      if (options.dryRun) {
        console.log('DRY RUN — Preview of migration:');
        console.log(`  Source: ${legacyPath}`);
        console.log('  Target files to create:');
        console.log(`    → ${path.join(aioxDir, 'framework-config.yaml')}`);
        console.log(`    → ${path.join(aioxDir, 'project-config.yaml')}`);
        console.log(`    → ${path.join(aioxDir, 'local-config.yaml')}`);
        console.log('  No files written (dry-run mode).');
        return;
      }

      // Create backup
      const backupPath = `${legacyPath}.backup`;
      await utils.backupFile(legacyPath, backupPath);
      console.log(`Backup created: ${backupPath}`);

      // Write layered files
      const yaml = require('js-yaml');
      const data = plan.sections || {};

      // Framework config (L1) — framework-level keys
      const frameworkKeys = ['metadata', 'resource_locations', 'performance_defaults', 'utility_scripts_registry', 'ide_sync_system'];
      const frameworkData = {};
      for (const k of frameworkKeys) {
        if (data[k] !== undefined) frameworkData[k] = data[k];
      }
      if (Object.keys(frameworkData).length === 0) {
        // Use all non-project keys as framework
        for (const [k, v] of Object.entries(data)) {
          if (!['project', 'ide', 'mcp', 'toolsLocation', 'lazyLoading'].includes(k)) {
            frameworkData[k] = v;
          }
        }
      }
      fs.writeFileSync(frameworkPath, yaml.dump(frameworkData), 'utf8');

      // Project config (L2)
      const projectKeys = ['project', 'ide', 'mcp', 'toolsLocation', 'lazyLoading', 'github_integration'];
      const projectData = {};
      for (const k of projectKeys) {
        if (data[k] !== undefined) projectData[k] = data[k];
      }
      if (Object.keys(projectData).length === 0) {
        for (const [k, v] of Object.entries(data)) {
          if (!frameworkData[k]) projectData[k] = v;
        }
      }
      fs.writeFileSync(projectConfigPath, yaml.dump(projectData), 'utf8');

      // Local config (L4)
      const localPath = path.join(aioxDir, 'local-config.yaml');
      if (!fs.existsSync(localPath)) {
        fs.writeFileSync(localPath, '# Machine-specific configuration (gitignored)\nlocal: {}\n', 'utf8');
      }

      console.log('Migration complete.');
      console.log(`  Created: ${frameworkPath}`);
      console.log(`  Created: ${projectConfigPath}`);
      console.log(`  Created: ${localPath}`);
    });

  // ─── validate ──────────────────────────────────────────────────────────────
  cmd
    .command('validate')
    .description('Validate YAML syntax across all configuration files')
    .option('-l, --level <level>', 'Validate specific level (L1|L2|L3|L4|framework|project|local)')
    .action(async (options) => {
      const projectRoot = process.cwd();
      const utils = getConfigUtils();

      let hasErrors = false;

      if (options.level) {
        // Validate specific level
        const yaml = require('js-yaml');
        const levelMap = {
          L1: 'framework-config.yaml', framework: 'framework-config.yaml',
          L2: 'project-config.yaml', project: 'project-config.yaml',
          L3: 'app-config.yaml', app: 'app-config.yaml',
          L4: 'local-config.yaml', local: 'local-config.yaml',
        };
        const file = levelMap[options.level];
        if (file) {
          const filePath = path.join(projectRoot, '.yard-core', file);
          if (fs.existsSync(filePath)) {
            try {
              yaml.load(fs.readFileSync(filePath, 'utf8'));
              console.log(`  ✓ ${file}`);
            } catch (err) {
              console.error(`  ✗ ${file}: ${err.message}`);
              hasErrors = true;
            }
          } else {
            console.log(`  ✓ ${file} (not present, skipped)`);
          }
        }
      } else {
        const results = await utils.validateAllConfigs(projectRoot);
        for (const { file, valid, error } of results) {
          if (valid) {
            console.log(`  ✓ ${file}`);
          } else {
            console.error(`  YAML ERROR in ${file}: ${error}`);
            hasErrors = true;
          }
        }
      }

      if (hasErrors) process.exit(1);
      if (!hasErrors) console.log('Config validation: PASS');
    });

  // ─── init-local ────────────────────────────────────────────────────────────
  cmd
    .command('init-local')
    .description('Generate machine-specific configuration file from template')
    .action(async () => {
      const projectRoot = process.cwd();
      const aioxDir = path.join(projectRoot, '.yard-core');
      const localPath = path.join(aioxDir, 'local-config.yaml');
      const templatePath = path.join(aioxDir, 'local-config.yaml.template');

      if (fs.existsSync(localPath)) {
        console.error(`local-config.yaml already exists at: ${localPath}`);
        console.error('Remove it first or edit it directly.');
        process.exit(1);
      }

      let content = '# Machine-specific YARD configuration\n# This file is gitignored\n\nlocal: {}\n';
      if (fs.existsSync(templatePath)) {
        content = fs.readFileSync(templatePath, 'utf8');
      }

      fs.mkdirSync(aioxDir, { recursive: true });
      fs.writeFileSync(localPath, content, 'utf8');
      console.log(`Created: ${localPath}`);

      // Ensure gitignored
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const entry = '.yard-core/local-config.yaml';
      let gitignoreContent = '';
      if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      }
      if (!gitignoreContent.includes(entry)) {
        fs.appendFileSync(gitignorePath, `\n${entry}\n`, 'utf8');
        console.log(`Added ${entry} to .gitignore`);
      }
    });

  return cmd;
}

module.exports = { createConfigCommand };
