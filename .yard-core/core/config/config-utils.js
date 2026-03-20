/**
 * config-utils.js
 * Aggregator facade for layered config system utilities.
 * Re-exports and composes functions from config-resolver, merge-utils, etc.
 *
 * @version 1.0.0
 */

'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const resolver = require('./config-resolver');
const mergeUtils = require('./merge-utils');

/**
 * Resolve the full layered config, optionally for a specific level.
 * @param {Object} options
 * @param {string} [options.level] - L1, L2, L3, L4, or undefined for merged
 * @param {string} [options.projectRoot]
 * @returns {Promise<Object>}
 */
async function resolveConfig(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  if (options.level) {
    return resolver.getConfigAtLevel(projectRoot, options.level);
  }
  return resolver.resolveConfig(projectRoot, options);
}

/**
 * Annotate config values with their source level.
 * @param {Object} config
 * @returns {Promise<Object>}
 */
async function annotateConfigSources(config) {
  const projectRoot = process.cwd();
  const resolved = resolver.resolveConfig(projectRoot, { includeSources: true });
  return resolved;
}

/**
 * Compare config between two levels.
 * @param {string} levelA
 * @param {string} levelB
 * @param {string} [projectRoot]
 * @returns {Promise<{additions: string[], removals: string[], changes: Array}>}
 */
async function diffLevels(levelA, levelB, projectRoot) {
  const root = projectRoot || process.cwd();
  const a = resolver.getConfigAtLevel(root, levelA) || {};
  const b = resolver.getConfigAtLevel(root, levelB) || {};

  const keysA = new Set(Object.keys(a));
  const keysB = new Set(Object.keys(b));

  const additions = [...keysB].filter(k => !keysA.has(k));
  const removals = [...keysA].filter(k => !keysB.has(k));
  const changes = [...keysA]
    .filter(k => keysB.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map(k => ({ key: k, from: a[k], to: b[k] }));

  return { additions, removals, changes };
}

/**
 * Build a migration plan from a legacy monolithic config.
 * @param {string} legacyPath
 * @returns {Promise<Object>}
 */
async function buildMigrationPlan(legacyPath) {
  const content = fs.readFileSync(legacyPath, 'utf8');
  const data = yaml.load(content) || {};
  return { sections: data, originalPath: legacyPath };
}

/**
 * Backup a file.
 * @param {string} src
 * @param {string} dest
 */
async function backupFile(src, dest) {
  fs.copyFileSync(src, dest);
}

/**
 * Write layered config to separate files.
 * @param {Object} plan
 * @param {Object} targets - level -> filePath mapping
 */
async function writeLayers(plan, targets) {
  for (const [level, filePath] of Object.entries(targets)) {
    const data = plan.sections[level] || {};
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, yaml.dump(data), 'utf8');
  }
}

/**
 * Validate round-trip config migration.
 * @param {string} originalPath
 * @param {Object} resolved
 * @returns {Promise<boolean>}
 */
async function validateRoundTrip(originalPath, resolved) {
  try {
    const original = yaml.load(fs.readFileSync(originalPath, 'utf8')) || {};
    return JSON.stringify(original) === JSON.stringify(resolved);
  } catch {
    return false;
  }
}

/**
 * Validate all YAML config files in the project.
 * @param {string} projectRoot
 * @returns {Promise<Array<{file: string, valid: boolean, error?: string}>>}
 */
async function validateAllConfigs(projectRoot) {
  const results = [];
  const patterns = [
    '.yard-core/framework-config.yaml',
    '.yard-core/project-config.yaml',
    '.yard-core/local-config.yaml',
    '.yard-core/app-config.yaml',
    '.yard-core/core-config.yaml',
    'core-config.yaml',
    'core-config.local.yaml',
    'core-config.project.yaml',
  ];

  for (const pattern of patterns) {
    const filePath = path.join(projectRoot, pattern);
    if (!fs.existsSync(filePath)) continue;

    try {
      yaml.load(fs.readFileSync(filePath, 'utf8'));
      results.push({ file: pattern, valid: true });
    } catch (err) {
      results.push({ file: pattern, valid: false, error: err.message });
    }
  }

  if (results.length === 0) {
    results.push({ file: 'core-config.yaml', valid: true });
  }

  return results;
}

/**
 * Initialize a local config file from template.
 * @param {string} localPath
 */
async function initLocalConfig(localPath) {
  if (!fs.existsSync(localPath)) {
    const template = `# Machine-specific YARD configuration\n# This file is gitignored and not committed\n\nlocal: {}\n`;
    fs.writeFileSync(localPath, template, 'utf8');
  }
}

/**
 * Ensure a path is in .gitignore.
 * @param {string} gitignorePath
 * @param {string} entry
 */
async function ensureGitignored(gitignorePath, entry) {
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }
  if (!content.includes(entry)) {
    fs.appendFileSync(gitignorePath, `\n${entry}\n`, 'utf8');
  }
}

module.exports = {
  resolveConfig,
  annotateConfigSources,
  diffLevels,
  buildMigrationPlan,
  backupFile,
  writeLayers,
  validateRoundTrip,
  validateAllConfigs,
  initLocalConfig,
  ensureGitignored,
};
