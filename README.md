# Runnio

Orchestrate multiple Claude Code agents across projects. Parallel. Persistent. Powerful.

## What is Runnio?

Runnio is a desktop application that lets you run multiple Claude Code agents simultaneously across different Git projects — each in an isolated worktree, with persistent terminal sessions, real-time status tracking, cost monitoring, and full Git history visualization.

Built with Electron, React 18, xterm.js, node-pty, and Zustand.

## Key Features

### Core
- **Multi-project** — Open multiple repositories simultaneously
- **Multi-agent** — Run multiple Claude Code agents in parallel per project
- **Persistent terminals** — Navigate between agents without losing context (terminals survive navigation, never unmount)
- **Git worktree isolation** — Each agent runs in its own worktree with independent branch
- **External worktree sync** — Detects worktrees created outside the app (polls every 3s)
- **Agent status tracking** — Real-time working/waiting/idle/done detection via terminal output heuristics
- **Claude Code readiness detection** — Auto-detects when Claude Code is ready and injects pending prompts

### Terminal
- **Split terminal** — Side-by-side view of two agents (Ctrl+\\)
- **Agent launch config** — Choose model (Sonnet/Opus/Haiku), mode (normal/plan/auto), and initial prompt before launch
- **Cost tracker** — Real-time token usage parsing from terminal output (input, output, cache read/write, USD cost)
- **5000-chunk buffer** — Full replay on reconnect after renderer reload
- **Cross-platform shell** — PowerShell 7+ / cmd (Windows), zsh/bash (macOS/Linux)
- **ConPTY support** — Proper ANSI rendering on Windows

### Workspace Tabs
- **Terminal** — Full xterm.js terminal with WebGL rendering, fit addon, web links, unicode 11, clipboard
- **Files** — Recursive file tree with git status indicators (M/A/D/?), syntax-highlighted preview
- **Diff** — Side-by-side line diff viewer with syntax highlighting (LCS algorithm)
- **History** — Visual commit graph with lane assignment, virtual scrolling, avatar lookup, Code and People modes
- **PR** — Pull request creation with diff preview and GitHub token validation
- **Notes** — Per-branch session notes with auto-save to localStorage

### Navigation
- **Command Palette** (Ctrl+K) — Fuzzy search across agents, projects, and actions
- **Quick Prompt** (Ctrl+Space) — Fast prompt input with broadcast (all agents / per project / active only) and template support
- **Breadcrumb navigation** — Project / Branch hierarchy in workspace header
- **Clickable logo** — Return to dashboard from anywhere

### Integrations
- **MCP server management** — Add/remove MCP servers at global or project scope
- **GitHub integration** — PR creation, issue listing, diff viewing (requires personal access token)
- **Plugin system** — Auto-detection with priority-based fallback

## Plugin System

Runnio auto-detects project structure and loads the appropriate plugin:

| Plugin | Priority | Detection |
|--------|----------|-----------|
| **Agency OS** | 100 | `agency/clients/` or `agency/{name}/profile.md` |
| **BMAD** | 90 | `.bmad/`, "bmad" in CLAUDE.md, `.claude/agents/` |
| **Generic** | 10 | `CLAUDE.md` at project root |
| **Raw** | 0 | Universal fallback (always matches) |

Each plugin provides context display in the dashboard and prompt templates in Quick Prompt. Manual override via `plugin` field in `runnio.config.json`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+P | Add project |
| Ctrl+N | New agent |
| Ctrl+K | Command Palette |
| Ctrl+Space | Quick Prompt |
| Ctrl+B | Toggle context panel |
| Ctrl+, | Settings |
| Ctrl+W | Close active agent (back to dashboard) |
| Ctrl+\\ | Toggle split terminal |
| Esc | Close all modals |

## Plans

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|----------|------------|
| Projects | 3 | Unlimited | Unlimited | Unlimited |
| Agents per project | 2 | Unlimited | Unlimited | Unlimited |
| Terminal + Worktree sync | Yes | Yes | Yes | Yes |
| Command Palette + Quick Prompt | Yes | Yes | Yes | Yes |
| Git History (full) | — | Yes | Yes | Yes |
| PR Flow | — | Yes | Yes | Yes |
| Cost Tracker | — | Yes | Yes | Yes |
| MCP Manager | — | Yes | Yes | Yes |
| Broadcast Prompts | — | Yes | Yes | Yes |
| Prompt Templates | — | Yes | Yes | Yes |
| Session Notes | — | Yes | Yes | Yes |
| Team Presence | — | — | Yes | Yes |
| Shared Workspaces | — | — | Yes | Yes |
| Team Dashboard + Launchpad | — | — | Yes | Yes |
| SSO + Audit Log | — | — | — | Yes |
| Self-Hosted | — | — | — | Yes |

## Architecture

Monorepo with three packages:

```
packages/core      — Shared logic (Git, plugins, agents, config). CJS, no React/UI.
packages/tui       — CLI with Ink 4.x (React terminal). ESM, type: module.
packages/desktop   — Electron 28 app (React 18 + Zustand + xterm.js + node-pty + esbuild).
```

### Tech Stack

- **Electron 28** — Frameless window, context-isolated preload, node-pty in main process
- **React 18** — Without JSX (all `React.createElement()` calls, no transpiler)
- **Zustand** — State management with localStorage persistence and hydration guard
- **xterm.js** — Terminal emulation with WebGL/Canvas renderer, fit, web links, unicode, clipboard addons
- **node-pty** — Native PTY for persistent terminal sessions
- **esbuild** — 3-target build (main CJS, preload CJS, renderer ESM)
- **simple-git** — Git operations (worktrees, log, diff, checkout)
- **highlight.js** — Syntax highlighting for file preview and diff viewer

### Key Design Decisions

- **Terminals in main process** — PTYs live in main, not renderer. 5000-chunk buffer for replay on reconnect. Terminals only close on explicit `terminal:close`, never on component unmount.
- **All agents mounted** — Workspace components stay mounted (`display: none/flex`) to preserve xterm state. No unmount/remount.
- **IPC serialization** — All objects pass through `JSON.parse(JSON.stringify())` before crossing the bridge.
- **Plugin priority** — Detection runs in priority order with 2s timeout per plugin.
- **Cost parsing** — Main process parses terminal output for Claude Code token/cost patterns in real-time.

## Installation

Download the latest release for your platform:
- **Windows**: `Runnio-Setup-x.x.x.exe` or `Runnio-x.x.x.exe` (portable)
- **macOS**: `Runnio-x.x.x.dmg` (coming soon)

## Requirements

- Windows 10 1903+ or macOS 12+
- Git installed and available in PATH
- Claude Code CLI installed and authenticated (`claude` command)

## Development

```bash
pnpm install                    # Install deps for all workspaces
pnpm build                      # Build all: core (tsc) → desktop (esbuild 3-target)
pnpm dev:desktop                # Build renderer + start Electron (DevTools opens auto)
pnpm dev:tui                    # Watch mode for TUI (tsc --watch)
```

**Build order matters:** core must compile first (desktop depends on `@runnio/core`).

See `STATUS.md` for detailed roadmap and `CLAUDE.md` for coding conventions.

## License

Copyright (c) 2026 Runnio. All rights reserved. Proprietary software.
