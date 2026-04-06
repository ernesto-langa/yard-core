/**
 * Migration Execute Module Tests
 *
 * @story 2.14 - Migration Script v2.0 → v2.1
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createModuleDirectories,
  migrateModule,
  executeMigration,
  saveMigrationState,
  loadMigrationState,
  clearMigrationState,
} = require('../../.yard-core/cli/commands/migrate/execute');
const { analyzeMigrationPlan } = require('../../.yard-core/cli/commands/migrate/analyze');

describe('Migration Execute Module', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `yard-execute-test-${Date.now()}`);
    await fs.promises.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    if (testDir && fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('createModuleDirectories', () => {
    it('should create all four module directories', async () => {
      const yardCoreDir = path.join(testDir, '.yard-core');
      await fs.promises.mkdir(yardCoreDir, { recursive: true });

      const result = await createModuleDirectories(yardCoreDir);

      expect(fs.existsSync(path.join(yardCoreDir, 'core'))).toBe(true);
      expect(fs.existsSync(path.join(yardCoreDir, 'development'))).toBe(true);
      expect(fs.existsSync(path.join(yardCoreDir, 'product'))).toBe(true);
      expect(fs.existsSync(path.join(yardCoreDir, 'infrastructure'))).toBe(true);
      expect(result.modules).toContain('core');
    });

    it('should not fail if directories already exist', async () => {
      const yardCoreDir = path.join(testDir, '.yard-core');
      await fs.promises.mkdir(path.join(yardCoreDir, 'core'), { recursive: true });

      const result = await createModuleDirectories(yardCoreDir);

      expect(result.created).not.toContain(path.join(yardCoreDir, 'core'));
    });
  });

  describe('migrateModule', () => {
    it('should migrate files to module directory', async () => {
      const yardCoreDir = path.join(testDir, '.yard-core');
      await fs.promises.mkdir(path.join(yardCoreDir, 'agents'), { recursive: true });
      await fs.promises.mkdir(path.join(yardCoreDir, 'development'), { recursive: true });
      await fs.promises.writeFile(path.join(yardCoreDir, 'agents', 'dev.md'), 'Agent');

      const moduleData = {
        files: [{
          sourcePath: path.join(yardCoreDir, 'agents', 'dev.md'),
          relativePath: path.join('agents', 'dev.md'),
          size: 5,
        }],
      };

      const result = await migrateModule(moduleData, 'development', yardCoreDir);

      expect(result.migratedFiles).toHaveLength(1);
      expect(fs.existsSync(path.join(yardCoreDir, 'development', 'agents', 'dev.md'))).toBe(true);
    });

    it('should support dry run mode', async () => {
      const yardCoreDir = path.join(testDir, '.yard-core');
      await fs.promises.mkdir(path.join(yardCoreDir, 'agents'), { recursive: true });
      await fs.promises.mkdir(path.join(yardCoreDir, 'development'), { recursive: true });
      await fs.promises.writeFile(path.join(yardCoreDir, 'agents', 'dev.md'), 'Agent');

      const moduleData = {
        files: [{
          sourcePath: path.join(yardCoreDir, 'agents', 'dev.md'),
          relativePath: path.join('agents', 'dev.md'),
          size: 5,
        }],
      };

      const result = await migrateModule(moduleData, 'development', yardCoreDir, { dryRun: true });

      expect(result.migratedFiles).toHaveLength(1);
      expect(result.migratedFiles[0].dryRun).toBe(true);
      // File should NOT be copied in dry run
      expect(fs.existsSync(path.join(yardCoreDir, 'development', 'agents', 'dev.md'))).toBe(false);
    });
  });

  describe('executeMigration', () => {
    it('should execute full migration', async () => {
      // Create v2.0 structure
      const yardCoreDir = path.join(testDir, '.yard-core');
      await fs.promises.mkdir(path.join(yardCoreDir, 'agents'), { recursive: true });
      await fs.promises.mkdir(path.join(yardCoreDir, 'registry'), { recursive: true });
      await fs.promises.mkdir(path.join(yardCoreDir, 'cli'), { recursive: true });
      await fs.promises.writeFile(path.join(yardCoreDir, 'agents', 'dev.md'), 'Agent');
      await fs.promises.writeFile(path.join(yardCoreDir, 'registry', 'index.js'), 'Registry');
      await fs.promises.writeFile(path.join(yardCoreDir, 'cli', 'index.js'), 'CLI');

      const plan = await analyzeMigrationPlan(testDir);
      const result = await executeMigration(plan, { cleanupOriginals: false });

      expect(result.success).toBe(true);
      expect(result.totalFiles).toBe(3);
      expect(fs.existsSync(path.join(yardCoreDir, 'development', 'agents', 'dev.md'))).toBe(true);
      expect(fs.existsSync(path.join(yardCoreDir, 'core', 'registry', 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(yardCoreDir, 'product', 'cli', 'index.js'))).toBe(true);
    });

    it('should return error for non-migratable plan', async () => {
      const plan = { canMigrate: false, error: 'Test error' };
      const result = await executeMigration(plan);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });

    it('should support dry run', async () => {
      const yardCoreDir = path.join(testDir, '.yard-core');
      await fs.promises.mkdir(path.join(yardCoreDir, 'agents'), { recursive: true });
      await fs.promises.writeFile(path.join(yardCoreDir, 'agents', 'dev.md'), 'Agent');

      const plan = await analyzeMigrationPlan(testDir);
      const result = await executeMigration(plan, { dryRun: true });

      expect(result.dryRun).toBe(true);
      // Directories should not be created in dry run
      expect(fs.existsSync(path.join(yardCoreDir, 'development'))).toBe(false);
    });
  });

  describe('Migration State', () => {
    it('should save and load migration state', async () => {
      await saveMigrationState(testDir, { phase: 'test', value: 123 });

      const state = await loadMigrationState(testDir);

      expect(state.phase).toBe('test');
      expect(state.value).toBe(123);
      expect(state.timestamp).toBeTruthy();
    });

    it('should return null if no state exists', async () => {
      const state = await loadMigrationState(testDir);
      expect(state).toBeNull();
    });

    it('should clear migration state', async () => {
      await saveMigrationState(testDir, { phase: 'test' });
      await clearMigrationState(testDir);

      const state = await loadMigrationState(testDir);
      expect(state).toBeNull();
    });
  });
});
