# Regent — Project Status

> Last updated: 2026-03-20
> Previous name: agentflow (rename pending — see Naming section)

## Product Vision

Regent is a Windows desktop app for orchestrating multiple Claude Code agents in parallel across multiple Git projects using worktrees. Each agent runs in its own isolated terminal with persistent PTY sessions that survive navigation. The app provides a unified dashboard for monitoring, prompting, and managing all agents simultaneously.

**Target audience:** Solo developers and small teams using Claude Code for parallel feature development.

**Differentiator vs raw Claude Code CLI:** Multi-project management, persistent terminal sessions, broadcast prompts, visual git history, PR creation, MCP server management — all from a single window.

## Current Version

- **Version:** 0.1.0 (package.json) / v0.1.1 (GitHub Release)
- **Stack:** Electron 28 + React 18 + Zustand 4 + xterm.js 5 + node-pty 1.1 + simple-git 3
- **Build:** esbuild (3-target: main/preload/renderer) + electron-builder (NSIS installer + portable)
- **Platform:** Windows only (Mac planned for launch)

## Feature Status

### Core Features

| Feature | Status | Details |
|---------|--------|---------|
| Multi-project store | Done | Zustand + persist to localStorage, hydration guard |
| Terminal persistence | Done | Dual: DOM all-mounted + main process PTY registry with 1000-chunk buffer replay |
| Claude readiness detection | Done | 7 output signals detected, prompt queued until ready |
| Agent status polling | Done | Every 2s via @agentflow/core detectAgentStatus |
| Worktree sync (external) | Done | Polls every 3s, auto-adds/removes agents for external worktrees |
| Broadcast prompts | Done | QuickPrompt sends to active / project / all agents |
| Chunked terminal paste | Done | Splits large pastes into 512-char chunks for Windows ConPTY |
| Branch validation | Done | git-check-ref-format rules before worktree creation |
| Clone repository | Done | 3-step modal with progress animation |
| Plugin detection | Done | Auto-detect agency-os/bmad/generic, re-polls every 10s while raw |

### Workspace Tabs

| Tab | Status | Details |
|-----|--------|---------|
| Terminal | Done | xterm.js + FitAddon, Ctrl+V paste, right-click paste, auto-resize |
| Files | Done | Recursive tree with git status (M/A/D/?), file viewer, 500 file limit |
| Diff | Done | LCS-based side-by-side diff, synchronized scroll, 5s polling, 2000 line cap |
| History | Done | SVG bezier graph with lane colors, Code/People modes, virtual scroll, avatars, agent diamonds, detail panel, checkout |
| PR | Done | 3-step flow (files, form, done), inline GitHub token setup, validation |
| Notes | Done | Per-branch localStorage, auto-save with 1s debounce |

### UI Components

| Component | Status | Details |
|-----------|--------|---------|
| TitleBar | Done | Custom frameless, gradient logo, quick action icons |
| Sidebar | Done | Project tree, agent status badges, external agent marker, add/remove |
| AgentBar | Done | Horizontal cards with status summary, waiting >2min glow animation |
| CommandPalette | Done | Ctrl+K, searches agents/projects/actions, keyboard nav |
| QuickPrompt | Done | Ctrl+Space, broadcast selector, history (max 20), plugin-aware templates |
| SettingsModal | Done | 3 tabs: General, GitHub, Config. Ctrl+, shortcut |
| MCPPanel | Done | Collapsible, reads/writes global + project .claude/settings.json |
| AddProjectModal | Done | Local folder or clone, plugin auto-detection |
| CreateAgentModal | Done | Branch validation, optional worktree creation |
| InitBanner | Done | 4 templates: auto, agencyOS, bmad, generic |
| Toast | Done | Stacked, slide-in animation, auto-dismiss 3s |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+P | Add project |
| Ctrl+N | New agent |
| Ctrl+K | Command palette |
| Ctrl+Space | Quick prompt |
| Ctrl+B | Toggle context panel |
| Ctrl+, | Settings |
| Ctrl+W | Close active agent |
| Escape | Close all modals |

## Architecture Overview

### Electron Main Process (main.ts — 888 lines)
- 27 IPC handlers across 10 domains (dialog, git, agent, plugin, config, terminal, files, github, mcp, settings)
- Terminal registry: persistent PTY sessions with buffer replay and Claude readiness detection
- Worktree watchers: per-project polling for external changes
- File tree: recursive directory listing with git status integration

### Preload Bridge (preload.ts — 111 lines)
- 43 methods exposed via contextBridge
- Strict context isolation (nodeIntegration: false)

### Renderer (React 18)
- **Store:** Zustand with persist middleware (11 state fields, 22 actions, 4 computed helpers)
- **Views:** Welcome, Dashboard, Workspace (3 views)
- **Components:** 17 components totaling ~4,200 lines
- **Hooks:** 3 custom hooks (agent status, worktree sync, plugin loader)
- **Utilities:** gitGraph.ts (lane assignment algorithm, 132 lines)

### Key Architectural Decisions
- All Workspace divs always mounted (display:none toggle) to preserve terminal sessions
- CSS variables design system (24 tokens) — no external CSS framework
- All React.createElement calls — no JSX transpilation needed
- JSON.parse(JSON.stringify()) on all IPC returns for serialization safety
- normalizePath() on all git operations for Windows compatibility

## Known Limitations

1. **No cost tracker** — `tokenUsage` field exists in AgentSession but no data collection or UI
2. **Manual GitHub token** — No OAuth flow; token pasted manually in Settings or PR tab
3. **MCP status unknown** — Shows configured servers but cannot detect if running
4. **Agent status heuristic** — Uses file-based detection via @agentflow/core, not direct Claude Code API
5. **Single window** — No multi-window support
6. **No auto-update** — Users download new versions manually
7. **Windows only** — No Mac or Linux builds yet
8. **Diff 2000 line cap** — Large files truncated in diff viewer
9. **File tree 500 file limit** — Large repos may be incomplete
10. **No syntax highlighting** — File viewer and diff show plain text

## Pending Work — Next Session Priorities

1. **Rename to Regent** — Update all references: package names, window title, store key, config paths, electron-builder config, README
2. **Mac build** — Add macOS target to electron-builder, test on Mac
3. **Pre-terminal config panel** — Let user choose model, mode, and initial prompt before launching agent
4. **Cost tracker** — Parse Claude Code output for token usage, display in UI
5. **Auto-update** — Integrate electron-updater for seamless updates

## Roadmap

### Block 1 — Foundation & Identity
- Rename to Regent across entire codebase
- New branding (logo, colors if needed)
- GitHub repo rename
- Update BMAD structure with new name

### Block 2 — Critical Fixes
- Pre-terminal config panel (model selection, permissions mode)
- Syntax highlighting in file viewer and diff (lightweight, no heavy deps)
- Improve agent status detection reliability
- Better error handling for git operations on non-git directories

### Block 3 — Cross-platform (Mac + Windows)
- macOS electron-builder target (DMG + zip)
- Test all features on Mac (path handling, PTY, window controls)
- Platform-specific shell detection (cmd.exe vs zsh/bash)
- Code signing for both platforms

### Block 4 — Premium Solo Features
- Cost tracker with per-agent and per-session totals
- Session recording/replay
- GitHub OAuth flow
- Auto-update via electron-updater
- Merge conflict editor (visual)
- PR review comments inline
- Multi-window support

### Block 5 — Team Features (Business Tier)
- Hybrid architecture: local Electron + cloud sync
- Shared project state across team members
- Launchpad: team-wide PR dashboard
- Activity feed: who's working on what
- Agent handoff between team members

### Block 6 — Monetization (Stripe + Billing)
- License key validation
- Stripe integration for subscriptions
- Usage metering for team tier
- Trial period management

### Block 7 — Launch
- Landing page
- Documentation site
- Onboarding flow
- Analytics (privacy-respecting)
- Support channel

## Business Model

| Plan | Price | Features |
|------|-------|----------|
| Free Solo | $0 | 1 project, 2 agents, core features |
| Pro Solo | $29/mo | Unlimited projects/agents, git history, PR flow, MCP manager |
| Business | $49/user/mo | Team sync, shared dashboards, launchpad, priority support |
| Enterprise | Custom | SSO, audit logs, on-prem option, dedicated support |

## Naming

The product is being renamed from **agentflow** to **Regent**. This rename has not been executed yet. When executing:
- Update `package.json` names across all packages
- Update `electron-builder.yml` (appId, productName, shortcutName)
- Update Zustand store key (`agentflow-store` → `regent-store`)
- Update config paths (`~/.agentflow/` → `~/.regent/`)
- Update all UI strings and window title
- Update localStorage keys
- Rename GitHub repo

## Development Workflow

All commands run from `packages/desktop/`:

```bash
cd packages/desktop

# 1. Build renderer + main + preload (required before first run)
node scripts/build-renderer.mjs

# 2. Run in dev mode (opens the app window)
npx electron .

# 3. After code changes, rebuild and reload:
node scripts/build-renderer.mjs    # recompile
# Ctrl+R inside the app reloads the RENDERER only
# For main process changes: quit and restart npx electron .

# 4. Build installer + portable (only for releases)
# IMPORTANT: close the running app first — the .exe locks files
npx electron-builder --win
```

### Self-development workflow
To use Regent to develop Regent itself:
1. Always run via `npx electron .` in dev mode — never use the `.exe`
2. Add the repo as a project inside the app
3. Create agents for feature branches
4. Claude Code makes changes → `node scripts/build-renderer.mjs` → Ctrl+R to reload
5. When stable, close the app, run `npx electron-builder --win` for release

## Strategic Context

### Decisions Made
- **Not open source** — Proprietary product with commercial licensing
- **GitHub private repo** — Source code not publicly available
- **Windows + Mac at launch** — Linux deferred to post-launch
- **Terminal-first approach** — Claude Code runs in raw terminal; no abstraction layer over it. The app orchestrates terminals, not AI calls.
- **Hybrid architecture for teams** — Local Electron app with optional cloud sync for team features. Solo users never need internet (except for GitHub API).
- **No Conductor competition** — Different market. Regent is for developers who already use Claude Code CLI and want multi-agent orchestration. Not a general-purpose AI coding tool.

### Technical Decisions
- **React.createElement over JSX** — Avoids JSX transpilation step, simpler esbuild config
- **Zustand over Redux** — Minimal boilerplate, built-in persist middleware
- **node-pty over alternatives** — Native PTY support required for Claude Code's interactive mode
- **simple-git over raw exec** — Safer parsing, better error handling
- **No CSS framework** — CSS variables design system keeps bundle small and control total

## Future Considerations

- Pre-terminal config panel (model, mode, initial prompt selection)
- Multi-AI support (Codex CLI, Gemini CLI, OpenCode adapters)
- Plugin marketplace for custom workflows
- Session recording and replay
- Merge conflict editor (visual, 3-way)
- Launchpad (team-wide PR and agent overview)
- Auto-update via electron-updater
- GitHub OAuth flow (replace manual token)
- Cost tracker UI (parse Claude Code output for token usage)
- Agent-to-agent communication channels
- PR review comments inline
- Multi-window support
- Linux build
- Syntax highlighting in file viewer and diff
