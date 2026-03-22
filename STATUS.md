# Runnio — Project Status

> Last updated: 2026-03-21
> Codebase name: Runnio (renamed from agentflow/regent on 2026-03-20)

## Product Vision

Runnio is a desktop app for orchestrating multiple Claude Code agents in parallel across multiple Git projects using worktrees. Each agent runs in its own persistent terminal (node-pty) with Claude Code readiness detection for automatic prompt injection. The app provides a unified dashboard for monitoring, prompting, and managing all agents simultaneously.

**Target audience:** Solo developers and small teams using Claude Code for parallel feature development.

**Differentiator:** Terminal-first approach — Runnio orchestrates raw Claude Code terminals, inheriting 100% of Claude Code capabilities automatically. No abstraction layer, no custom AI interface. A lightweight pre-launch config panel (model, mode, initial prompt) is planned as a complement, not a replacement.

## Current Version

- **Version:** 0.1.5 (package.json) / v0.1.5 (GitHub Release)
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
| Agent status polling | Done | Every 2s via @runnio/core detectAgentStatus |
| Worktree sync (external) | Done | Polls every 3s per project, auto-adds/removes agents for worktrees created outside app |
| Broadcast prompts | Done | QuickPrompt with active/project/all target selector, uses injectWhenReady per agent |
| Chunked terminal paste | Done | Splits large pastes into 512-char chunks for Windows ConPTY |
| Branch validation | Done | git-check-ref-format rules before worktree creation |
| Clone repository | Done | 3-step modal (choose/clone/cloning) with progress animation |
| Plugin detection | Done | Auto-detect agency-os/bmad/generic, re-polls every 10s while plugin=raw |
| Cost tracker | Not implemented | tokenUsage field exists in AgentSession type but zero UI or data collection |

### Workspace Layout

| Area | Status | Details |
|------|--------|---------|
| Terminal (main) | Done | xterm.js + FitAddon, always-mounted, fills workspace width. Split view with browser preview (60/40) |
| History (main) | Done | SVG bezier graph, agent detection, virtual scroll. Second main tab |
| Right Panel | Done | Collapsible 420px side panel with Files, Diff, PR, Notes, Changes tabs. Toolbar toggles |
| Info Bar | Done | 28px bar: provider icon + model name + project name |
| Browser Preview | Done | Localhost URL detection, iframe preview, URL bar, split terminal view |

### Right Panel Tabs (5 tabs)

| Tab | Status | Details |
|-----|--------|---------|
| Files | Done | Recursive tree with git status (M/A/D/?), click-to-read viewer, 500 file limit, binary detection |
| Diff | Done | Custom LCS-based line diff, side-by-side panes, auto-refresh, 5s polling, 2000 line cap, syntax highlighting |
| PR | Done | 3-step flow (files/form/done), inline GitHub token input with validation, real GitHub API calls |
| Notes | Done | Per-branch localStorage, auto-save with 1s debounce |
| Changes | Done | Real-time git status, Stage All + Commit buttons, inline commit message, 5s polling |

### UI Components (17 components)

| Component | Lines | Status |
|-----------|-------|--------|
| GitHistory | ~900 | Done — Code/People modes, SVG graph with proper bezier curves, agent detection (email + body + branch), provider avatars, avatar groups, enhanced detail panel with badges and file stats |
| PRPanel | 342 | Done — GitHub API, inline token setup |
| DiffViewer | 306 | Done — LCS diff, file tabs, polling |
| SettingsModal | ~530 | Done — 6-section left-nav. All settings functional or removed. General: model/mode/polling/worktree/notifications. Agents: CLI detection. Integrations: GitHub token + Notion MCP. Repository: branch pattern. Interface: theme + terminal font/size (live apply). Account: GitHub status + dev mode |
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
8. **Diff 2000 line cap** — Large files truncated
10. **File tree 500 file limit** — Large repos incomplete
11. **No synchronized scrolling** in diff viewer
12. **People mode** — Agent/Contributor swimlanes with commit lists, no sparklines or density charts yet

## Pending Work — Next Session Priorities

1. ~~**Rename to Runnio**~~ — Done (2026-03-20)
2. ~~**Feature flags system**~~ — Done (2026-03-20). `src/features.ts` with plan-based flags, UpgradeGate component
3. ~~**Pre-terminal config panel**~~ — Done (2026-03-20). Model selection, permissions mode, initial prompt
4. ~~**Syntax highlighting**~~ — Done (2026-03-20). highlight.js integration for Files and Diff tabs
5. **Mac build** — electron-builder macOS target, platform shell detection, path handling
6. **Cost tracker** — Parse Claude Code terminal output for token usage display
7. ~~**Contrast/accessibility polish**~~ — Done (2026-03-20). Theme system added with Dark, Dark Navy, Light, System modes
8. ~~**Settings redesign**~~ — Done (2026-03-20). 6-section left-nav layout with CLI detection
9. ~~**History bezier curves**~~ — Done (2026-03-20). Merge and branch-off curves now render correctly
10. ~~**Multi-provider support**~~ — Done (2026-03-21). Provider registry, launch panel selector, command preview
11. ~~**Toolbar redesign**~~ — Done (2026-03-21). Toggle icons, back/forward nav, Home access
12. ~~**Global Terminal**~~ — Done (2026-03-21). Multi-project directory access, context header injection
13. ~~**Homepage**~~ — Done (2026-03-21). Active agents, projects overview, recent activity
14. ~~**Lucide React icons**~~ — Done (2026-03-21). All emojis replaced with Lucide SVG icons
15. ~~**Dark Navy default theme**~~ — Done (2026-03-21). CSS variables and store default updated
16. ~~**Pro plan default**~~ — Done (2026-03-21). All features unlocked by default until billing exists

## Roadmap

### Block 1 — Foundation & Identity (done)
- ~~Rename entire codebase from agentflow/regent to Runnio~~ Done
- ~~Add proprietary LICENSE file~~ Done
- ~~Add copyright headers to main files~~ Done
- ~~Update README~~ Done
- Make GitHub repo private and rename to "regent" (manual — see REPO_SETUP.md)
- ~~Update BMAD structure with new name~~ Done

### Block 2 — Feature Flags System (done)
- ~~Implement feature flag infrastructure in src/features.ts~~ Done
- ~~UpgradeGate component that shows upgrade screen when plan limit hit~~ Done
- ~~All flags default to "free" tier until billing is connected~~ Done

### Block 3 — Critical Fixes & Missing Features (done)
- ~~Pre-terminal config panel (model selection, permissions mode, initial prompt)~~ Done
- ~~Syntax highlighting in file viewer and diff~~ Done (highlight.js, 15 languages)
- ~~Contrast and visibility audit~~ Done (CSS variables updated, hardcoded colors replaced)
- Improve agent status detection reliability (ongoing)

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

The product has been renamed from **agentflow/regent** to **Runnio** (2026-03-20).

Completed:
- `package.json` (all 3 packages: @runnio/core, @runnio/tui, @runnio/desktop)
- `electron-builder.yml` (appId: com.runnio.desktop, productName: Runnio)
- Zustand store key → `runnio-store`
- Global config path → `~/.runnio/config.json`
- All UI strings → "Runnio"
- Window title → "Runnio"
- localStorage keys → `runnio:*`
- Config file → `runnio.config.json`
- BMAD structure files
- CLAUDE.md, CONTEXT.md, STATUS.md, README.md
- Copyright headers on main files
- Proprietary LICENSE file

Remaining (manual):
- GitHub repo name (see REPO_SETUP.md)

## Development Workflow

All commands run from monorepo root:

```bash
# Install deps (required after clone or folder rename)
pnpm install

# Build all packages (core → desktop)
pnpm build

# Run in dev mode (all features unlocked via RUNNIO_DEV=true)
pnpm dev:desktop

# After code changes:
pnpm dev:desktop    # rebuilds renderer + starts Electron
# Ctrl+R reloads RENDERER only
# Main process changes require full restart

# Build installer + portable (releases only)
# Close the running app first — .exe locks files
cd packages/desktop && npx electron-builder --win
```

### Running in development mode (all features unlocked)
`pnpm dev:desktop` sets `RUNNIO_DEV=true` automatically, which bypasses all feature gates (enterprise plan). A yellow "DEV" badge appears in the TitleBar.

To run manually:
```bash
cd packages/desktop
cross-env RUNNIO_DEV=true node scripts/build-renderer.mjs && cross-env RUNNIO_DEV=true electron .
```

Running without `RUNNIO_DEV=true` (e.g. `electron .` directly) uses the free plan with feature gates active.

### Self-development workflow
1. Run via `pnpm dev:desktop` — never use the .exe during development
2. Add the repo as a project inside the app
3. Create agents for feature branches
4. Code changes → `pnpm dev:desktop` → Ctrl+R
5. When stable, close app, run `npx electron-builder --win`

## Strategic Context

### Confirmed Decisions
- **Not open source** — Proprietary commercial product
- **GitHub private repo** — Source code not publicly available
- **Windows + Mac simultaneous at launch** — Linux deferred to post-launch
- **Terminal-first approach** — Runnio orchestrates terminals, not AI calls directly. No pre-terminal AI interface (like Conductor). Raw terminal inherits 100% of Claude Code capabilities. A lightweight config panel (model, mode, initial prompt) is planned as complement, not replacement.
- **Hybrid architecture for teams** — Local Electron app + cloud sync only for team features. Solo users never need internet (except GitHub API).
- **Multi-AI support** — Codex CLI, Gemini CLI, OpenCode adapters on roadmap as Business/Enterprise feature, not current priority
- **Business model** — Free Solo / Business ($19/mo + $12/seat) / Enterprise (negotiated)

## Future Considerations

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
- People mode improvements (swimlanes, sparklines, density charts)
