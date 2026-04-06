/**
 * YARD Directory Check
 *
 * Verifies .yard/ directory structure and permissions.
 *
 * @module yard-core/health-check/checks/project/yard-directory
 * @version 1.0.0
 * @story HCS-2 - Health Check System Implementation
 */

const fs = require('fs').promises;
const path = require('path');
const { BaseCheck, CheckSeverity, CheckDomain } = require('../../base-check');

/**
 * Expected .yard directory structure
 */
const EXPECTED_STRUCTURE = [
  { path: '.yard', type: 'directory', required: false },
  { path: '.yard/config.yaml', type: 'file', required: false },
  { path: '.yard/reports', type: 'directory', required: false },
  { path: '.yard/backups', type: 'directory', required: false },
];

/**
 * YARD directory structure check
 *
 * @class YardDirectoryCheck
 * @extends BaseCheck
 */
class YardDirectoryCheck extends BaseCheck {
  constructor() {
    super({
      id: 'project.yard-directory',
      name: 'YARD Directory Structure',
      description: 'Verifies .yard/ directory structure',
      domain: CheckDomain.PROJECT,
      severity: CheckSeverity.MEDIUM,
      timeout: 2000,
      cacheable: true,
      healingTier: 1, // Can auto-create directories
      tags: ['yard', 'directory', 'structure'],
    });
  }

  /**
   * Execute the check
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Check result
   */
  async execute(context) {
    const projectRoot = context.projectRoot || process.cwd();
    const yardPath = path.join(projectRoot, '.yard');
    const issues = [];
    const found = [];

    // Check if .yard exists at all
    try {
      const stats = await fs.stat(yardPath);
      if (!stats.isDirectory()) {
        return this.fail('.yard exists but is not a directory', {
          recommendation: 'Remove .yard file and run health check again',
        });
      }
      found.push('.yard');
    } catch {
      // .yard doesn't exist - this is optional
      return this.pass('.yard directory not present (optional)', {
        details: {
          message: '.yard directory is created automatically when needed',
          healable: true,
        },
      });
    }

    // Check subdirectories
    for (const item of EXPECTED_STRUCTURE.filter((i) => i.path !== '.yard')) {
      const fullPath = path.join(projectRoot, item.path);
      try {
        const stats = await fs.stat(fullPath);
        const typeMatch = item.type === 'directory' ? stats.isDirectory() : stats.isFile();
        if (typeMatch) {
          found.push(item.path);
        } else {
          issues.push(`${item.path} exists but is wrong type`);
        }
      } catch {
        if (item.required) {
          issues.push(`Missing: ${item.path}`);
        }
      }
    }

    // Check write permissions
    try {
      const testFile = path.join(yardPath, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch {
      issues.push('.yard directory is not writable');
    }

    if (issues.length > 0) {
      return this.warning(`YARD directory has issues: ${issues.join(', ')}`, {
        recommendation: 'Run health check with --fix to create missing directories',
        healable: true,
        healingTier: 1,
        details: { issues, found },
      });
    }

    return this.pass('YARD directory structure is valid', {
      details: { found },
    });
  }

  /**
   * Get healer for this check
   * @returns {Object} Healer configuration
   */
  getHealer() {
    return {
      name: 'create-yard-directories',
      action: 'create-directories',
      successMessage: 'Created missing YARD directories',
      fix: async (_result) => {
        const projectRoot = process.cwd();
        const dirs = ['.yard', '.yard/reports', '.yard/backups', '.yard/backups/health-check'];

        for (const dir of dirs) {
          const fullPath = path.join(projectRoot, dir);
          await fs.mkdir(fullPath, { recursive: true });
        }

        return { success: true, message: 'Created YARD directories' };
      },
    };
  }
}

module.exports = YardDirectoryCheck;
