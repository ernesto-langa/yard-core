# Task: Update YARD Framework

> **Version:** 4.0.0
> **Created:** 2026-01-29
> **Updated:** 2026-01-31
> **Type:** SYNC (git-native framework synchronization)
> **Agent:** @devops (Gage) or @yard (Orion)
> **Execution:** Simple bash script (~15 lines)

## Purpose

Git-native sync of YARD framework from upstream repository. Uses sparse clone + file comparison for safe review before applying changes. All local customizations preserved automatically by backup/restore.

---

## Quick Usage

```bash
# Run the update script
bash .yard-core/scripts/update-yard.sh

# Review changes shown by the script, then:
git add .yard-core && git commit -m "chore: sync YARD framework"   # Apply changes
# OR
git checkout -- .yard-core/                                         # Cancel changes
```

---

## How It Works

The script uses sparse clone + file comparison:

1. **Clone upstream** - Sparse shallow clone of ernesto-langa/yard-core (only `.yard-core/`)
2. **Compare files** - Uses `comm` for O(n) file list comparison
3. **Backup local-only** - Files that exist only locally are backed up
4. **Sync** - Copy upstream files, restore local-only files
5. **Report** - Shows created/updated/deleted/preserved counts
6. **User decides** - Commit to apply or checkout to cancel

**Why this approach:**
- Sparse clone is fast (~5 seconds)
- O(n) comparison vs O(n²) nested loops
- Local-only files always preserved
- Clear report before committing

---

## Protected Files (NEVER overwritten)

These paths are automatically preserved (local-only files are backed up and restored):

| Path | Reason |
|------|--------|
| `.yard-core/squads/` | Custom copywriters, data, ralph |
| `.yard-core/marketing/` | Marketing-specific agents/tasks |
| `source/` | Business context YAML |
| `Knowledge/` | Knowledge bases |
| `.yard-core/context/` | Compiled contexts |
| `CLAUDE.md` | Project rules |
| `.claude/commands/` | Custom commands |
| `.claude/rules/` | Custom rules |
| `.antigravity/` | Antigravity config |
| `.gemini/` | Gemini config |
| `MCPs/` | MCP integrations |
| `Contexto/` | Business context |
| `Output/` | Deliverables |
| `docs/` | Project documentation |
| `scripts/` | Python scripts |
| `.env` | Secrets |

---

## Task Definition

```yaml
task: updateYARDFramework
agent: devops
mode: simple
timeout: 60  # 1 minute max

execution:
  script: .yard-core/scripts/update-yard.sh

workflow:
  1. If dirty working tree: git add -A && git commit -m "chore: pre-update commit"
  2. bash .yard-core/scripts/update-yard.sh
  3. Review changes displayed
  4. git add .yard-core && git commit -m "chore: sync YARD framework"  # to apply
  5. git checkout -- .yard-core/                                        # to cancel

pre-conditions:
  - git status clean (if dirty, auto-commit with "chore: pre-update commit")

post-conditions:
  - local-only files preserved (backup/restore)
  - changes ready for review (unstaged)

acceptance:
  - script completes without error
  - user can review changes before committing
  - local customizations preserved
```

---

## Verification

After running the script:

```bash
# Check that local-only files are preserved
ls -la .yard-core/squads/  # if exists
ls -la source/                       # if exists

# See what changed (unstaged)
git diff --stat
```

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| "Commit changes first" | Uncommitted changes | Agent auto-commits before running script |
| "Failed to fetch upstream" | Network issue | Check internet connection |
| Merge conflicts | File changed both locally and upstream | Script auto-resolves by preserving local |

---

## Rollback

```bash
# If you already committed and want to undo:
git reset --hard HEAD~1

# If you haven't committed yet:
git checkout -- .yard-core/
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 4.0.0 | 2026-01-31 | **SIMPLIFIED:** Git-native approach, 15-line bash script replaces 847-line JS |
| 3.1.0 | 2026-01-30 | Dynamic protection for squad commands |
| 3.0.0 | 2026-01-29 | YOLO mode with rsync |
| 1.0.0 | 2026-01-29 | Initial version (verbose, interactive) |
