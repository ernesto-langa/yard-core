# Technical Preferences

This document captures architectural and technical preferences for the YARD-Framework project. It is owned by `@architect` and consulted during agent activation by `@dev`, `@qa`, `@devops`, `@architect`, and `@data-engineer`.

---

## Language & Runtime

- **Primary language:** JavaScript (Node.js) for CLI and framework core
- **Node.js version:** LTS (see `package.json` `engines` field)
- **Package manager:** npm

## Code Style

- Follow `docs/framework/coding-standards.md` for all naming, import, and formatting rules
- ESLint + Prettier enforced via pre-commit hooks
- Absolute imports preferred over relative imports (Constitution Article VI)

## Testing

- **Framework:** Jest
- **Coverage threshold:** 80% (lines, functions, branches)
- Test files co-located or under `tests/`

## Database

- **Preferred DB:** PostgreSQL via Supabase
- RLS policies required on all user-facing tables
- Migrations managed via `supabase db push`

## Infrastructure

- CI/CD via GitHub Actions (`.github/workflows/`)
- Docker used only for MCP server isolation
- No containerization of the main CLI application

## Dependency Policy

- Minimize third-party dependencies; prefer Node.js built-ins
- All new dependencies require `@architect` approval
- Lock file (`package-lock.json`) committed to repository

---

*Owner: @architect | Update trigger: manual edit or `*add-tech-doc` | Used by: @dev, @qa, @devops, @architect, @data-engineer*
