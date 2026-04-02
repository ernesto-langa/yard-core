# AGENTS.md - Synkra YARD (Codex CLI)

Este arquivo define as instrucoes do projeto para o Codex CLI.

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

<!-- YARD-MANAGED-START: commands -->
## Common Commands

- `npm run sync:ide`
- `npm run sync:ide:check`
- `npm run sync:skills:codex`
- `npm run sync:skills:codex:global` (opcional; neste repo o padrao e local-first)
- `npm run validate:structure`
- `npm run validate:agents`
<!-- YARD-MANAGED-END: commands -->

<!-- YARD-MANAGED-START: shortcuts -->
## Agent Shortcuts

Preferencia de ativacao no Codex CLI:
1. Use `/skills` e selecione `yard-<agent-id>` vindo de `.codex/skills` (ex.: `yard-architect`)
2. Se preferir, use os atalhos abaixo (`@architect`, `/architect`, etc.)

Interprete os atalhos abaixo carregando o arquivo correspondente em `.yard-core/development/agents/` (fallback: `.codex/agents/`), renderize o greeting via `generate-greeting.js` e assuma a persona ate `*exit`:

- `@architect`, `/architect`, `/architect.md` -> `.yard-core/development/agents/architect.md`
- `@dev`, `/dev`, `/dev.md` -> `.yard-core/development/agents/dev.md`
- `@qa`, `/qa`, `/qa.md` -> `.yard-core/development/agents/qa.md`
- `@pm`, `/pm`, `/pm.md` -> `.yard-core/development/agents/pm.md`
- `@po`, `/po`, `/po.md` -> `.yard-core/development/agents/po.md`
- `@sm`, `/sm`, `/sm.md` -> `.yard-core/development/agents/sm.md`
- `@analyst`, `/analyst`, `/analyst.md` -> `.yard-core/development/agents/analyst.md`
- `@devops`, `/devops`, `/devops.md` -> `.yard-core/development/agents/devops.md`
- `@data-engineer`, `/data-engineer`, `/data-engineer.md` -> `.yard-core/development/agents/data-engineer.md`
- `@ux-design-expert`, `/ux-design-expert`, `/ux-design-expert.md` -> `.yard-core/development/agents/ux-design-expert.md`
- `@squad-creator`, `/squad-creator`, `/squad-creator.md` -> `.yard-core/development/agents/squad-creator.md`
- `@yard-master`, `/yard-master`, `/yard-master.md` -> `.yard-core/development/agents/yard-master.md`
<!-- YARD-MANAGED-END: shortcuts -->
