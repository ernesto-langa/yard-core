# Gemini Rules - YARD-Framework

Este arquivo define as instrucoes do projeto para Gemini CLI neste repositorio.

<!-- YARD-MANAGED-START: core -->
## Core Rules

1. Siga a Constitution em `.yard-core/constitution.md`
2. Priorize `CLI First -> Observability Second -> UI Third`
3. Trabalhe por stories em `docs/stories/`
4. Nao invente requisitos fora dos artefatos existentes
<!-- YARD-MANAGED-END: core -->

<!-- YARD-MANAGED-START: quality -->
## Quality Gates

- Rode `npm run lint`
- Rode `npm run typecheck`
- Rode `npm test`
- Atualize checklist e file list da story antes de concluir
<!-- YARD-MANAGED-END: quality -->

<!-- YARD-MANAGED-START: codebase -->
## Project Map

- Core framework: `.yard-core/`
- CLI entrypoints: `bin/`
- Shared packages: `packages/`
- Tests: `tests/`
- Docs: `docs/`
<!-- YARD-MANAGED-END: codebase -->

<!-- YARD-MANAGED-START: gemini-integration -->
## Gemini Integration

Fonte de verdade de agentes:
- Canonico: `.yard-core/development/agents/*.md`
- Espelhado para Gemini: `.gemini/rules/YARD/agents/*.md`

Hooks e settings:
- Hooks locais: `.gemini/hooks/`
- Settings locais: `.gemini/settings.json`

Sempre que houver drift, execute:
- `npm run sync:ide:gemini`
- `npm run validate:gemini-sync`
- `npm run validate:gemini-integration`
<!-- YARD-MANAGED-END: gemini-integration -->

<!-- YARD-MANAGED-START: parity -->
## Multi-IDE Parity

Para garantir paridade entre Claude Code, Codex e Gemini:
- `npm run validate:parity`
- `npm run validate:paths`
<!-- YARD-MANAGED-END: parity -->

<!-- YARD-MANAGED-START: activation -->
## Agent Activation

Preferencia de ativacao:
1. Use agentes em `.gemini/rules/YARD/agents/`
2. Se necessario, use fonte canonica em `.yard-core/development/agents/`

Ao ativar agente:
- carregar definicao completa do agente
- renderizar greeting via `node .yard-core/development/scripts/generate-greeting.js <agent-id>`
- manter persona ativa ate `*exit`

Atalhos recomendados no Gemini:
- `/yard-menu` para listar agentes
- `/yard-<agent-id>` (ex.: `/yard-dev`, `/yard-architect`)
- `/yard-agent <agent-id>` para launcher generico
<!-- YARD-MANAGED-END: activation -->

<!-- YARD-MANAGED-START: commands -->
## Common Commands

- `npm run sync:ide`
- `npm run sync:ide:check`
- `npm run sync:ide:gemini`
- `npm run validate:gemini-sync`
- `npm run validate:gemini-integration`
- `npm run validate:parity`
- `npm run validate:structure`
- `npm run validate:agents`
<!-- YARD-MANAGED-END: commands -->
