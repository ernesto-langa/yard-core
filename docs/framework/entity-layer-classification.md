# Entity Layer Classification (L1-L4)

Classification rules for the AIOX entity registry boundary layers.

## Layer Model

| Layer | Name | Mutability | Description |
|-------|------|------------|-------------|
| **L1** | Framework Core | Immutable | Core modules, CLI executables, constitution |
| **L2** | Framework Templates | Extend-only | Tasks, templates, checklists, workflows, infrastructure |
| **L3** | Project Config | Customizable | Data files, agent MEMORY.md, .claude/ config, *-config.yaml |
| **L4** | Project Runtime | Dynamic | Docs, stories, packages, tests, squads (fallback) |

## Classification Rules

Rules are evaluated in order. **First match wins.**

| Priority | Layer | Path Pattern | Examples |
|----------|-------|-------------|----------|
| 1 | L1 | `.yard-core/core/**` | ids/index.js, utils/helpers.js |
| 2 | L1 | `bin/**` | aiox.js, aiox-init.js |
| 3 | L1 | `.yard-core/constitution.md` | (exact match) |
| 4 | L3 | `.yard-core/data/**` | entity-registry.yaml |
| 5 | L3 | `**/MEMORY.md` | agents/dev/MEMORY.md |
| 6 | L3 | `.claude/**` | CLAUDE.md, settings.json |
| 7 | L3 | `core-config.yaml`, `project-config.yaml` | (exact match) |
| 8 | L3 | `*-config.yaml` (root only) | custom-config.yaml |
| 9 | L2 | `.yard-core/development/**` | tasks/, templates/, agents/ |
| 10 | L2 | `.yard-core/infrastructure/**` | scripts/, tools/ |
| 11 | L2 | `.yard-core/product/**` | templates/, checklists/ |
| 12 | L4 | Everything else | docs/, tests/, packages/ |

**Important:** Rule 5 (MEMORY.md) must come before Rule 9 (development/) so that `agents/dev/MEMORY.md` classifies as L3 instead of L2.

## SCAN_CONFIG to Layer Mapping

| SCAN_CONFIG Category | basePath | Layer |
|---------------------|----------|-------|
| modules | .yard-core/core | L1 |
| utils | .yard-core/core/utils | L1 |
| tasks | .yard-core/development/tasks | L2 |
| templates | .yard-core/product/templates | L2 |
| scripts | .yard-core/development/scripts | L2 |
| checklists | .yard-core/development/checklists | L2 |
| workflows | .yard-core/development/workflows | L2 |
| tools | .yard-core/development/tools | L2 |
| infra-scripts | .yard-core/infrastructure/scripts | L2 |
| infra-tools | .yard-core/infrastructure/tools | L2 |
| product-checklists | .yard-core/product/checklists | L2 |
| product-data | .yard-core/product/data | L2 |
| agents | .yard-core/development/agents | L2 (MEMORY.md = L3) |
| data | .yard-core/data | L3 |

## Usage

```javascript
const { classifyLayer } = require('./.yard-core/core/ids/layer-classifier');

classifyLayer('.yard-core/core/ids/index.js');  // => 'L1'
classifyLayer('.yard-core/development/tasks/create-next-story.md');  // => 'L2'
classifyLayer('.yard-core/data/entity-registry.yaml');  // => 'L3'
classifyLayer('docs/stories/story-1.md');  // => 'L4'
```

## Implementation

- **Module:** `.yard-core/core/ids/layer-classifier.js`
- **Exports:** `classifyLayer(entityPath)`, `LAYER_RULES`
- **Integrated with:** `populate-entity-registry.js`, `registry-updater.js`
- **Preserved by:** `registry-healer.js` (does not strip unknown fields)

## Story Reference

Story BM-5: Entity Registry Layer Classification (L1-L4)
