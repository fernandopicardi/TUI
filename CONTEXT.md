# Regent — Session Context

Read this file before doing any work on the project.

## What is Regent

Regent is a Windows Electron desktop app that orchestrates multiple Claude Code agents in parallel across Git projects using worktrees. Each agent runs in a persistent terminal (node-pty) with Claude Code readiness detection for prompt injection.

## Current state in one line

Fully functional MVP on Windows with 6 workspace tabs (Terminal, Files, Diff, History, PR, Notes), broadcast prompts, MCP manager, settings — rename from "agentflow" to "Regent" pending.

## What NOT to do

- Do NOT rename anything to "agentflow" — the product is being renamed to **Regent**
- Do NOT make the repository public — it is proprietary
- Do NOT use JSX syntax — this project uses `React.createElement()` calls exclusively
- Do NOT hardcode paths with forward slashes — always use `path.join()` or `normalizePath()`
- Do NOT expose Node APIs directly to the renderer — always go through preload.ts
- Do NOT add external CSS frameworks — use the existing CSS variables system
- Do NOT use `JSON.stringify()` alone for IPC returns — always wrap with `JSON.parse(JSON.stringify())`
- Do NOT unmount Workspace components — all agents stay mounted with `display: none` to preserve terminal sessions

## Next priority

Rename from "agentflow" to "Regent" across the entire codebase (see STATUS.md Naming section for checklist).

## Critical files to understand the project

| File | Purpose |
|------|---------|
| `packages/desktop/STATUS.md` | Complete project status, roadmap, architecture |
| `packages/desktop/src/types.ts` | All TypeScript types and the AgentflowAPI interface |
| `packages/desktop/src/store/index.ts` | Zustand store — state model, actions, persistence |
| `packages/desktop/electron/main.ts` | All IPC handlers (27 channels), terminal registry, git operations |
| `packages/desktop/electron/preload.ts` | Context bridge — 43 methods exposed to renderer |
| `packages/desktop/src/App.tsx` | Root component — layout, hydration, keyboard shortcuts |
| `packages/desktop/src/views/Workspace.tsx` | Per-agent view with 6 tabs |
| `packages/desktop/src/index.html` | CSP policy, CSS variables, animations |
| `packages/desktop/electron-builder.yml` | Build config for installer + portable |
| `packages/desktop/scripts/build-renderer.mjs` | esbuild 3-target build script |

## Architecture quick reference

```
Electron Main Process (main.ts)
  ├── Terminal Registry (persistent PTY sessions)
  ├── IPC Handlers (27 channels)
  ├── Worktree Watchers (per-project polling)
  └── Claude Readiness Detection (output signal matching)

Preload Bridge (preload.ts)
  └── contextBridge.exposeInMainWorld('agentflow', { ... })

Renderer (React 18 + Zustand)
  ├── App.tsx (root layout, hydration, shortcuts)
  ├── Views: Welcome | Dashboard | Workspace
  ├── 17 Components (~4,200 lines total)
  ├── 3 Hooks (agent status, worktree sync, plugin loader)
  └── Store (Zustand + persist to localStorage)
```

## Key patterns

- **Terminal persistence:** All Workspaces always mounted (display:none toggle). PTY lives in main process registry with 1000-chunk buffer for replay on reconnect.
- **Prompt injection:** `terminal:inject-when-ready` queues prompt until Claude Code outputs a readiness signal, then writes to PTY.
- **IPC safety:** All IPC returns wrapped in `JSON.parse(JSON.stringify())`. All paths through `normalizePath()`.
- **CSS:** Design tokens via CSS variables (24 tokens in `:root`). No external framework.
- **State:** Zustand store persists `projects`, `activeProjectId`, `activeAgentId` to localStorage.
