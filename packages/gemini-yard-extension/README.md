# AIOX Gemini CLI Extension

Brings Synkra Yard multi-agent orchestration to Gemini CLI.

## Installation

```bash
gemini extensions install github.com/synkra/yard-core/packages/gemini-yard-extension
```

Or manually copy to `~/.gemini/extensions/yard/`

## Features

### Quick Agent Launcher
Use slash commands for fast activation flow (Codex `$`-like UX):
- `/yard-menu` - show all quick launch commands
- `/yard-dev`
- `/yard-architect`
- `/yard-qa`
- `/yard-devops`
- `/yard-master`
- and other `/yard-<agent-id>` commands

Each launcher returns a ready-to-send activation prompt plus greeting preview.

### Commands
- `/yard-status` - Show system status
- `/yard-agents` - List available agents
- `/yard-validate` - Validate installation
- `/yard-menu` - Show quick launch menu
- `/yard-agent <id>` - Generic launcher by agent id

### Hooks
Automatic integration with AIOX memory and security:
- Session context loading
- Gotchas and patterns injection
- Security validation (blocks secrets)
- Audit logging

## Requirements

- Gemini CLI v0.26.0+
- Yard Core installed (`npx yard-core install`)
- Node.js 18+

## Cross-CLI Compatibility

AIOX skills work identically in both Claude Code and Gemini CLI. Same agents, same commands, same format.

## License

MIT
