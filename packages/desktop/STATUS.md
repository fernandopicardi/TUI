# Regent — Project Status

> Last updated: 2026-03-20
> Current codebase name: agentflow (rename to Regent pending — see Naming section)

## Product Vision

Regent is a desktop app for orchestrating multiple Claude Code agents in parallel across multiple Git projects using worktrees. Each agent runs in its own persistent terminal (node-pty) with Claude Code readiness detection for automatic prompt injection. The app provides a unified dashboard for monitoring, prompting, and managing all agents simultaneously.

**Target audience:** Solo developers and small teams using Claude Code for parallel feature development.

**Differentiator:** Terminal-first approach — Regent orchestrates raw Claude Code terminals, inheriting 100% of Claude Code capabilities automatically. No abstraction layer, no custom AI interface. A lightweight pre-launch config panel (model, mode, initial prompt) is planned as a complement, not a replacement.

## Current Version

- **Version:** 0.1.0 (package.json) / v0.1.1 (GitHub Release)
- **Stack:** Electron 28 + React 18 + Zustand 4 + xterm.js 5 + node-pty 1.1 + simple-git 3
- **Build:** esbuild (3-target: main/preload/renderer) + electron-builder (NSIS installer + portable)
- **Platform:** Windows only (Mac planned for simultaneous launch)
- **Total source:** ~6,400 lines across 31 files

## Feature Status

### Core Features

| Feature | Status | Details |
|---------|--------|---------|
| Multi-project store | Done | Zustand + persist to localStorage, hydration guard |
| Terminal persistence | Done | All Workspaces always mounted (display:none). PTY registry in main process with 1000-chunk buffer replay |
| Claude readiness detection | Done | 7 output signals matched, prompt queued via injectWhenReady until ready |
| Agent status polling | Done | Every 2s via @agentflow/core detectAgentStatus |
| Worktree sync (external) | Done | Polls every 3s per project, auto-adds/removes agents for worktrees created outside app |
| Broadcast prompts | Done | QuickPrompt with active/project/all target selector, uses injectWhenReady per agent |
| Chunked terminal paste | Done | Splits large pastes into 512-char chunks for Windows ConPTY |
| Branch validation | Done | git-check-ref-format rules before worktree creation |
| Clone repository | Done | 3-step modal (choose/clone/cloning) with progress animation |
| Plugin detection | Done | Auto-detect agency-os/bmad/generic, re-polls every 10s while plugin=raw |
| Cost tracker | Not implemented | tokenUsage field exists in AgentSession type but zero UI or data collection |

### Workspace Tabs (6 tabs)

| Tab | Status | Details |
|-----|--------|---------|
| Terminal | Done | xterm.js + FitAddon, Ctrl+V paste with dedup, right-click paste, auto-resize |
| Files | Done | Recursive tree with git status (M/A/D/?), click-to-read viewer, 500 file limit, binary detection |
| Diff | Done | Custom LCS-based line diff, side-by-side panes, auto-refresh on tab switch, 5s polling, 2000 line cap. No synchronized scrolling. No syntax highlighting. |
| History | Done | SVG bezier graph with lane colors, Code mode with virtual scroll (36px rows), People mode with author grouping (no sparklines/swimlanes — simple list per author). Gravatar avatars, agent diamond nodes, detail panel with files/checkout. |
| PR | Done | 3-step flow (files/form/done), inline GitHub token input with validation, real GitHub API calls |
| Notes | Done | Per-branch localStorage, auto-save with 1s debounce |

### UI Components (17 components)

| Component | Lines | Status |
|-----------|-------|--------|
| GitHistory | 778 | Done — Code/People modes, SVG graph, virtual scroll, detail panel |
| PRPanel | 342 | Done — GitHub API, inline token setup |
| DiffViewer | 306 | Done — LCS diff, file tabs, polling |
| SettingsModal | 298 | Done — 3 tabs: General (openCommand, refreshInterval), GitHub (token+test), Config (project JSON) |
| FileTree | 292 | Done — Tree + viewer, git status, filter |
| MCPPanel | 288 | Done — Reads/writes real ~/.claude/settings.json and .claude/settings.json |
| AddProjectModal | 256 | Done — Local folder or clone |
| QuickPrompt | 217 | Done — Broadcast, history, templates |
| Sidebar | 198 | Done — Project tree, agent badges, external marker |
| Workspace | 192 | Done — 6 tabs, status indicator |
| Dashboard | 180 | Done — Agent grid, init banner, plugin context |
| Terminal | 174 | Done — xterm.js, paste dedup, readiness detection |
| CreateAgentModal | 170 | Done — Branch validation, worktree checkbox |
| AgentBar | 159 | Done — Status summary, waiting glow |
| CommandPalette | 152 | Done — Search, keyboard nav |
| Welcome | 113 | Done — Logo, add project, recent list |
| TitleBar | 105 | Done — Custom frameless, action icons |
| WorkspaceNotes | 68 | Done — Per-branch, auto-save |
| InitBanner | 63 | Done — 4 templates |
| Toast | 50 | Done — Stacked, slide-in, auto-dismiss |
| AgentStatusBadge | 38 | Done — Pulse animations |

### IPC Layer

| Layer | Count | Lines |
|-------|-------|-------|
| main.ts IPC handlers | 39 (33 handle + 6 on) | 887 |
| preload.ts methods | 43 | 110 |
| Store state fields | 11 | — |
| Store actions | 22 | — |
| Store computed helpers | 4 | — |

## Architecture Overview

```
Electron Main Process (main.ts — 887 lines)
  ├── Terminal Registry (persistent PTY with buffer replay + Claude readiness)
  ├── 39 IPC handlers across 11 domains
  ├── Worktree Watchers (per-project polling every 3s)
  └── File Tree (recursive with git status, 500 file limit)

Preload Bridge (preload.ts — 110 lines)
  └── 43 methods via contextBridge (strict context isolation)

Renderer (React 18 + Zustand)
  ├── App.tsx — root layout, hydration guard, 8 keyboard shortcuts
  ├── 3 Views: Welcome, Dashboard, Workspace
  ├── 17 Components (~4,200 lines)
  ├── 3 Hooks: useAgentStatus (28L), useWorktreeSync (54L), usePlugin (65L)
  ├── 1 Utility: gitGraph.ts (131L) — lane assignment, agent detection, time formatting
  └── Store: Zustand + persist (181L) — 11 fields, 22 actions, 4 computed
```

## Known Limitations

1. **No cost tracker** — Type field exists but zero implementation
2. **Manual GitHub token** — No OAuth flow; token pasted in Settings or PR tab
3. **MCP status unknown** — Shows configured servers but cannot detect if running
4. **Agent status heuristic** — File-based detection, not direct Claude Code API
5. **Single window** — No multi-window support
6. **No auto-update** — Manual download for new versions
7. **Windows only** — No Mac or Linux builds
8. **No syntax highlighting** — File viewer and diff show plain text
9. **Diff 2000 line cap** — Large files truncated
10. **File tree 500 file limit** — Large repos incomplete
11. **No synchronized scrolling** in diff viewer
12. **People mode is simple** — Author-grouped commit list, no swimlanes or sparklines

## Pending Work — Next Session Priorities

1. **Rename to Regent** — All references: package names, window title, store key, config paths, electron-builder, README, BMAD structure
2. **Feature flags system** — `src/features.ts` with plan-based flags, FeatureGate component, all defaulting to free tier
3. **Pre-terminal config panel** — Model selection, permissions mode, initial prompt before launching agent
4. **Mac build** — electron-builder macOS target, platform shell detection, path handling
5. **Syntax highlighting** — Lightweight solution for file viewer and diff

## Roadmap

### Block 1 — Foundation & Identity (next)
- Rename entire codebase from agentflow to Regent
- Add proprietary LICENSE file
- Add copyright headers to main files
- Update README
- Make GitHub repo private and rename to "regent"
- Update BMAD structure with new name

### Block 2 — Feature Flags System
- Implement feature flag infrastructure in src/features.ts
- FeatureGate component that shows upgrade screen when plan limit hit
- All flags default to "free" tier until billing is connected

### Block 3 — Critical Fixes & Missing Features
- Pre-terminal config panel (model selection, permissions mode, initial prompt)
- Syntax highlighting in file viewer and diff
- Improve agent status detection reliability
- Fix any features currently marked as partial

### Block 4 — Cross-platform (Windows + Mac simultaneous launch)
- macOS electron-builder target (DMG + zip)
- Platform-specific shell detection (cmd.exe vs zsh/bash)
- Test all features on Mac
- Code signing for both platforms
- GitHub Actions CI/CD for automated builds

### Block 5 — Premium Solo Features
- Cost tracker (parse Claude Code output, display per-agent and per-session)
- GitHub OAuth flow
- Auto-update via electron-updater
- Merge conflict editor (visual, 3-way)
- PR review comments inline
- Multi-window support
- Session recording/replay

### Block 6 — Team Features (Business Tier)
- Auth and identity (GitHub OAuth for team)
- Real-time presence (see team members and their active agents)
- Shared workspaces across team members
- Launchpad: team-wide PR and agent dashboard
- Activity feed
- Roles: admin, dev
- Centralized billing

### Block 7 — Enterprise Features
- SSO (Google, GitHub, SAML)
- Audit log
- Advanced roles (viewer, reviewer)
- Self-hosted option
- SLA and dedicated support

### Block 8 — Monetization (Stripe)
- License key validation
- Stripe integration for Solo Pro and Business subscriptions
- In-app upgrade flow when feature gate is hit
- Webhook for real-time plan updates

### Block 9 — Launch
- Landing page (Windows + Mac downloads, pricing table)
- Documentation site
- Onboarding flow improvements
- Product Hunt + Show HN launch preparation

## Business Model

| Plan | Price | Features |
|------|-------|----------|
| Free Solo | $0 | Limited projects and agents (exact limits TBD), core features |
| Business | $19/mo + $12/additional seat | Unlimited projects/agents, team sync, launchpad, shared workspaces |
| Enterprise | Negotiated | SSO, audit logs, self-hosted option, dedicated support |

## Naming

The product is being renamed from **agentflow** to **Regent**. This rename has NOT been executed yet.

Locations that need updating:
- `package.json` (all 3 packages: name fields)
- `electron-builder.yml` (appId, productName, shortcutName)
- Zustand store key (`agentflow-store` → `regent-store`)
- Global config path (`~/.agentflow/` → `~/.regent/`)
- All UI strings referencing "agentflow"
- Window title
- localStorage keys (prompt history, notes)
- CSP connect-src if needed
- GitHub repo name
- BMAD structure files
- CLAUDE.md references

## Development Workflow

All commands run from `packages/desktop/`:

```bash
cd packages/desktop

# 1. Build renderer + main + preload (required before first run)
node scripts/build-renderer.mjs

# 2. Run in dev mode
npx electron .

# 3. After code changes:
node scripts/build-renderer.mjs    # recompile
# Ctrl+R reloads RENDERER only
# Main process changes require full restart (quit + npx electron .)

# 4. Build installer + portable (releases only)
# Close the running app first — .exe locks files
npx electron-builder --win
```

### Self-development workflow
1. Run via `npx electron .` — never use the .exe during development
2. Add the repo as a project inside the app
3. Create agents for feature branches
4. Code changes → `node scripts/build-renderer.mjs` → Ctrl+R
5. When stable, close app, run `npx electron-builder --win`

## Strategic Context

### Confirmed Decisions
- **Not open source** — Proprietary commercial product
- **GitHub private repo** — Source code not publicly available
- **Windows + Mac simultaneous at launch** — Linux deferred to post-launch
- **Terminal-first approach** — Regent orchestrates terminals, not AI calls directly. No pre-terminal AI interface (like Conductor). Raw terminal inherits 100% of Claude Code capabilities. A lightweight config panel (model, mode, initial prompt) is planned as complement, not replacement.
- **Hybrid architecture for teams** — Local Electron app + cloud sync only for team features. Solo users never need internet (except GitHub API).
- **Multi-AI support** — Codex CLI, Gemini CLI, OpenCode adapters on roadmap as Business/Enterprise feature, not current priority
- **Business model** — Free Solo / Business ($19/mo + $12/seat) / Enterprise (negotiated)

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
- People mode improvements (swimlanes, sparklines, density charts)
