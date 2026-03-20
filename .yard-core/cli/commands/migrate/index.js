'use strict';
const { Command } = require('commander');
const { detectV2Structure, analyzeMigrationPlan } = require('./analyze');
const { createBackup, verifyBackup } = require('./backup');
const { executeMigration } = require('./execute');
const { updateAllImports, verifyImports } = require('./update-imports');
const { validateStructure } = require('./validate');
const { executeRollback, canRollback } = require('./rollback');

function createMigrateCommand() {
  const cmd = new Command('migrate').description('Migrate YARD project structure');

  cmd.command('analyze')
    .description('Analyze project for migration')
    .action(async () => {
      try {
        const plan = await analyzeMigrationPlan(process.cwd());
        console.log(JSON.stringify(plan, null, 2));
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  cmd.command('execute')
    .description('Execute migration')
    .option('--dry-run', 'Preview without changes')
    .action(async (options) => {
      try {
        const result = await executeMigration(process.cwd(), options);
        console.log(result.success ? 'Migration complete.' : 'Migration failed.');
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  cmd.command('rollback')
    .description('Rollback migration')
    .action(async () => {
      try {
        const result = await executeRollback(process.cwd());
        console.log(result.message);
        if (!result.success) process.exit(1);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  return cmd;
}

module.exports = { createMigrateCommand };
