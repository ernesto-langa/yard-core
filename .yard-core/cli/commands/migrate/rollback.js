/**
 * migrate/rollback.js
 * Rollback a migration back to the original v2.0 state using backup directory.
 *
 * @module cli/commands/migrate/rollback
 * @version 1.1.0
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Find the most recent backup directory in projectRoot
 * @param {string} projectRoot
 * @returns {string|null} backup dir path or null
 */
function findLatestBackupDir(projectRoot) {
  if (!fs.existsSync(projectRoot)) return null;
  const entries = fs.readdirSync(projectRoot);
  const backupDirs = entries
    .filter(e => e.startsWith('.yard-backup-'))
    .map(e => path.join(projectRoot, e))
    .filter(p => fs.statSync(p).isDirectory())
    .sort()
    .reverse(); // most recent first

  return backupDirs.length > 0 ? backupDirs[0] : null;
}

/**
 * Check if rollback is possible (backup directory exists)
 *
 * @param {string} projectRoot - Project root directory
 * @returns {{ canRollback: boolean, backupDir?: string }}
 */
function canRollback(projectRoot) {
  // Check for backup directory (v2.0 → v2.1 migration backup)
  const backupDir = findLatestBackupDir(projectRoot);
  if (backupDir) {
    return { canRollback: true, backupDir };
  }

  // Check for simple config backup file (config layered migration)
  const simpleBackup = path.join(projectRoot, '.yard-core', 'core-config.yaml.backup');
  if (fs.existsSync(simpleBackup)) {
    return { canRollback: true, backupDir: null };
  }

  return { canRollback: false };
}

/**
 * Execute rollback from v2.1 back to v2.0 using backup directory
 *
 * @param {string} projectRoot - Project root directory
 * @param {Object} options - Options
 * @param {boolean} [options.dryRun] - Preview only, no changes
 * @returns {Promise<{ success: boolean, message: string, restoredFiles?: number }>}
 */
async function executeRollback(projectRoot, options = {}) {
  const status = canRollback(projectRoot);

  if (!status.canRollback) {
    return { success: false, message: 'No backup found. Cannot rollback.' };
  }

  // Use backup directory if available
  if (status.backupDir) {
    return executeBackupDirRollback(projectRoot, status.backupDir, options);
  }

  // Fall back to simple config file rollback
  return executeConfigFileRollback(projectRoot, options);
}

/**
 * Rollback using backup directory (v2.0 → v2.1 migration)
 */
async function executeBackupDirRollback(projectRoot, backupDir, options = {}) {
  if (options.dryRun) {
    return {
      success: true,
      dryRun: true,
      message: `DRY RUN: Would restore from ${backupDir}`,
    };
  }

  // Read backup manifest if available
  const manifestPath = path.join(backupDir, 'backup-manifest.json');
  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      // Ignore parse errors
    }
  }

  // Restore .yard-core from backup
  const backupYardCore = path.join(backupDir, '.yard-core');
  const targetYardCore = path.join(projectRoot, '.yard-core');

  let restoredFiles = 0;

  if (fs.existsSync(backupYardCore)) {
    // Remove current .yard-core
    fs.rmSync(targetYardCore, { recursive: true, force: true });
    // Copy backup .yard-core back
    restoredFiles = copyDirSync(backupYardCore, targetYardCore);
  } else if (manifest && manifest.files) {
    // Restore individual files from manifest
    for (const fileEntry of manifest.files) {
      const srcPath = path.join(backupDir, fileEntry.relativePath);
      const destPath = path.join(projectRoot, fileEntry.relativePath);
      if (fs.existsSync(srcPath)) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
        restoredFiles++;
      }
    }
  }

  return {
    success: true,
    message: `Rollback complete. Restored ${restoredFiles} files from backup.`,
    restoredFiles,
  };
}

/**
 * Rollback simple config file migration
 */
async function executeConfigFileRollback(projectRoot, options = {}) {
  const yardDir = path.join(projectRoot, '.yard-core');
  const legacyPath = path.join(yardDir, 'core-config.yaml');
  const backupPath = path.join(yardDir, 'core-config.yaml.backup');

  if (options.dryRun) {
    return {
      success: true,
      dryRun: true,
      message: `DRY RUN: Would restore ${backupPath} → ${legacyPath}`,
    };
  }

  fs.copyFileSync(backupPath, legacyPath);
  fs.unlinkSync(backupPath);

  return {
    success: true,
    message: 'Rollback complete. Restored core-config.yaml from backup.',
    restoredFiles: 1,
  };
}

/**
 * Copy directory recursively, returns count of files copied
 */
function copyDirSync(src, dest) {
  let count = 0;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

module.exports = { canRollback, executeRollback };
