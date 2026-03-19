# agentflow

Orchestrate multiple Claude Code agents in parallel across multiple projects, with isolated Git worktrees and automatic project context detection.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◆ agentflow                                                        │
├──────────────────────────────────────────────────────────────────────┤
│  3 running · 1 waiting                                              │
│  ┌───────────────────┐ ┌───────────────────┐ ┌──────────────────┐   │
│  │ agency-os         │ │ agency-os         │ │ mirra            │   │
│  │ ● feature/acme    │ │ ○ feature/techco  │ │ ● feature/clone  │   │
│  └───────────────────┘ └───────────────────┘ └──────────────────┘   │
├─────────────┬────────────────────────────────────────────────────────┤
│  AGENCY-OS  │                                                       │
│  ├ ● acme   │   Terminal │ Diff │ PR │ Notes                        │
│  ├ ○ techco │                                                       │
│  └ ○ main   │   claude> analyzing project structure...              │
│             │   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│  MIRRA      │                                                       │
│  └ ● clone  │                                                       │
│             │                                                       │
│  AGENTFLOW  │                                                       │
│  └ ○ main   │                                                       │
│─────────────│                                                       │
│ [+ project] │                                                       │
│─────────────│                                                       │
│ v0.1.1  ⚙  │                                                       │
└─────────────┴────────────────────────────────────────────────────────┘
```

## Architecture

pnpm workspaces monorepo:

```
agentflow/
├── packages/
│   ├── core/       ← shared logic (git, plugins, agents, config)
│   ├── tui/        ← TUI app (Ink/React terminal)
│   └── desktop/    ← Electron app (multi-project MVP)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

| Package | Description |
|---------|-------------|
| `@agentflow/core` | Git worktrees, plugin system, agent status detection, config loader |
| `@agentflow/tui` | TUI with Ink 4.x — `agentflow` CLI |
| `@agentflow/desktop` | Electron desktop app — multi-project, persistent terminals, dark mode |

## Key Concepts

### Multi-Project Model

agentflow manages **multiple projects** in a single window. Each project contains **agents** — independent Claude Code sessions running in isolated Git worktrees.

```
agentflow (multi-project)
├── agency-os
│   ├── ● feature/acme-homepage    working
│   ├── ○ feature/techco-pricing   waiting
│   └── ✓ fix/store-nav            done
├── mirra
│   └── ● feature/clone-mode       working
└── agentflow
    └── ○ main                     idle
```

### Persistent Terminal Sessions

Terminal sessions survive navigation. Switching between agents does **not** kill the terminal process — the pty stays alive in the main process with a 1000-chunk output buffer for instant replay on reconnection.

### Plugin Context Detection

Plugins detect project structure automatically and activate relevant context panels.

| Plugin | Priority | Detects when |
|--------|----------|--------------|
| Agency OS | 100 | `agency/clients/` or subfolders with `profile.md` |
| BMAD | 90 | `.bmad/`, "BMAD" in CLAUDE.md, or `.claude/agents/` |
| Generic | 10 | `CLAUDE.md` at root |
| Raw | 0 | Always (fallback) |

## Installation

### Desktop (Electron)

```bash
git clone https://github.com/fernandopicardi/TUI.git
cd TUI
pnpm install
cd packages/desktop
pnpm build:win
# Installer output in release/
```

### TUI (CLI)

```bash
pnpm install -g github:fernandopicardi/TUI
```

## Development

```bash
pnpm install
pnpm build          # build core + tui + desktop
pnpm dev:desktop    # run Electron in dev mode
pnpm dev:tui        # watch mode TUI
```

## Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| `Ctrl+Shift+P` | Add project |
| `Ctrl+N` | New agent (in active project) |
| `Ctrl+W` | Close active agent |
| `Ctrl+K` | Command palette |
| `Ctrl+Space` | Quick prompt |
| `Ctrl+B` | Toggle context panel |
| `Ctrl+,` | Settings |
| `Esc` | Close modals |

## Keyboard Shortcuts (TUI)

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate between workspaces |
| `Enter` | Open workspace with Claude Code |
| `n` | Create new worktree |
| `d` | Delete selected worktree |
| `r` | Force refresh |
| `q` | Quit |

## Configuration

`agentflow.config.json` at project root:

```json
{
  "plugin": "agency-os",
  "agencyPath": "custom/path/to/clients",
  "refreshInterval": 3000,
  "terminal": "wt",
  "maxVisibleWorkspaces": 8,
  "showTimestamps": true,
  "openCommand": "claude"
}
```

## Tech Stack

- **TypeScript** — strict typing throughout
- **pnpm workspaces** — monorepo management
- **Electron 28** — desktop app with frameless window
- **React 18** — UI rendering (React.createElement, no JSX)
- **Zustand 4** — state management with localStorage persistence
- **xterm.js 5.3** — terminal rendering with fit addon
- **node-pty 1.1** — Windows ConPTY process spawning
- **simple-git** — git operations
- **esbuild** — 3-target build (main/preload/renderer)
- **Ink 4.x** — React for terminal (TUI package)

## Data Model

```typescript
interface Project {
  id: string           // hash of rootPath
  name: string         // repo folder name
  rootPath: string
  plugin: string       // 'raw' | 'generic' | 'agency-os' | 'bmad'
  agents: AgentSession[]
}

interface AgentSession {
  id: string           // `${projectId}-${branch}`
  branch: string
  worktreePath: string
  status: 'working' | 'waiting' | 'idle' | 'done'
  terminalId: string   // persistent pty in main process
}
```

## License

MIT
