# Regent — Session Context

Read this file before doing any work on the project.

## What is Regent

Regent is a Windows Electron desktop app that orchestrates multiple Claude Code agents in parallel across Git projects using worktrees. Each agent runs in a persistent terminal (node-pty) with Claude Code readiness detection for automatic prompt injection. The terminal-first approach means Regent orchestrates raw Claude Code — no abstraction layer, 100% capability inheritance.

## Current state in one line

Fully functional Windows MVP with 6 workspace tabs (Terminal, Files, Diff, History, PR, Notes), broadcast prompts, MCP manager, settings, feature flags system.

## What NOT to do

- Do NOT use the name "agentflow" for new code — the product is **Regent**
- Do NOT make the repository public — it is proprietary
- Do NOT use JSX syntax — this project uses `React.createElement()` calls exclusively
- Do NOT hardcode paths with forward slashes — always use `path.join()` or `normalizePath()`
- Do NOT expose Node APIs directly to the renderer — always go through preload.ts
- Do NOT add external CSS frameworks — use the existing CSS variables system in index.html
- Do NOT use `JSON.stringify()` alone for IPC returns — always wrap with `JSON.parse(JSON.stringify())`
- Do NOT unmount Workspace components — all agents stay mounted with `display: none` to preserve terminal sessions
- Do NOT add JSX transpilation — esbuild config uses plain React.createElement

## Next priority

Pre-terminal config panel (model selection, permissions mode, initial prompt before launching agent).

## Critical files to understand the project

| File | Purpose |
|------|---------|
| `packages/desktop/STATUS.md` | Complete project status, roadmap, architecture, business model |
| `CONTEXT.md` | This file — session quick-start |
| `packages/desktop/src/types.ts` | All TypeScript types and the RegentAPI interface |
| `packages/desktop/src/store/index.ts` | Zustand store — state fields, actions, computed helpers |
| `packages/desktop/electron/main.ts` | IPC handlers, terminal registry, git operations |
| `packages/desktop/electron/preload.ts` | Context bridge — methods exposed to renderer |
| `packages/desktop/src/App.tsx` | Root component — layout, hydration, keyboard shortcuts |
| `packages/desktop/src/views/Workspace.tsx` | Per-agent view with 6 tabs |
| `packages/desktop/src/index.html` | CSP policy, CSS variables, animations |
| `packages/desktop/src/features.ts` | Feature flags system — plan-based gating |
| `packages/desktop/electron-builder.yml` | Build config for NSIS installer + zip |

## Architecture quick reference

```
Electron Main Process (main.ts)
  ├── Terminal Registry (persistent PTY + buffer replay + Claude readiness)
  ├── IPC handlers across 11 domains
  ├── Worktree Watchers (per-project polling every 3s)
  └── File Tree (recursive with git status, 500 file limit)

Preload Bridge (preload.ts)
  └── Methods via contextBridge (strict context isolation)

Renderer (React 18 + Zustand)
  ├── App.tsx — root layout, hydration guard, keyboard shortcuts
  ├── 3 Views: Welcome, Dashboard, Workspace
  ├── Components (Sidebar, Terminal, GitHistory, PRPanel, DiffViewer, etc.)
  ├── Hooks: useAgentStatus, useWorktreeSync, usePlugin
  ├── Utility: gitGraph.ts — lane assignment algorithm
  ├── Features: feature flags with UpgradeGate component
  └── Store: Zustand + persist to localStorage
```

## Key patterns

- **Terminal persistence:** All Workspaces always mounted (display:none toggle). PTY lives in main process registry with 1000-chunk buffer for replay on reconnect.
- **Prompt injection:** `terminal:inject-when-ready` queues prompt until Claude Code outputs a readiness signal (7 patterns), then writes to PTY with 500ms delay.
- **IPC safety:** All IPC returns wrapped in `JSON.parse(JSON.stringify())`. All paths through `normalizePath()`.
- **CSS:** Design tokens via CSS variables in `:root`. No external framework.
- **State:** Zustand persists `projects`, `activeProjectId`, `activeAgentId` to localStorage key `regent-store`.
- **React:** All `React.createElement()` — no JSX. esbuild bundles as IIFE for browser target.
- **Feature flags:** Plan-based gating via `features.ts`. `UpgradeGate` component wraps premium features.

## Strategic context

- **Not open source** — proprietary commercial product
- **Windows + Mac simultaneous at launch** — Linux deferred
- **Terminal-first** — no AI abstraction, raw Claude Code terminals
- **Hybrid for teams** — local app + cloud sync for team features only
- **Business model:** Free Solo / Business ($19/mo + $12/seat) / Enterprise (negotiated)
- **Multi-AI support** (Codex, Gemini CLI) on roadmap, not current priority

## Development commands

```bash
cd packages/desktop
node scripts/build-renderer.mjs   # compile
npx electron .                     # run dev mode
# Ctrl+R = reload renderer only
# Main process changes = quit + restart
npx electron-builder --win         # build .exe (close app first)
```
