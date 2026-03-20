# Runnio

## What it is
Multi-project Claude Code agent orchestrator for Windows, using Git worktrees for branch isolation and persistent terminals via node-pty.

## Monorepo architecture

```
packages/core     — Shared logic (Git, plugins, agents, config). CJS, no React/UI.
packages/tui      — CLI with Ink 4.x (React terminal). ESM, type: module.
packages/desktop  — Electron 28 app (React 18 + Zustand + xterm.js + node-pty + esbuild).
```

### @runnio/core — main exports
- **Git:** `listWorktrees`, `createWorktree`, `removeWorktree`, `watchWorktrees`, `getCurrentBranch`
- **Utils:** `normalizePath`, `joinPath`, `resolvePath`, `getRepoRoot`, `getRepoName`, `pathExists`, `fileExists`, `readFileSafe`, `withTimeout`
- **Agents:** `detectAgentStatus`, `getRunningNodeProcesses`
- **Config:** `loadConfig`
- **Plugins:** `resolvePlugin`, `loadPluginSafe`, `registerPlugin`
- **Readers:** `readClients` (Agency OS), `readBmadData` (BMAD)

### @runnio/desktop — IPC channels
- `dialog:open-directory` — folder picker with Git repo validation
- `git:*` — list-worktrees, create-worktree, remove-worktree, get-current-branch, watch-worktrees, watch-project-worktrees, clone
- `agent:get-status` — detects working/waiting/idle/done by file mtime
- `plugin:load` — resolve + load plugin with 2s timeout
- `terminal:*` — create (with buffer replay), input, resize, close, get-buffer, is-alive, inject-when-ready
- `github:*` — get-diff (simple-git status + show), create-pr (GitHub REST API with token)
- `mcp:*` — get-config (global + project), add-server, remove-server
- `settings:*` — read/write global (~/.runnio/config.json) and project (runnio.config.json)
- `files:*` — list (recursive tree with git status), read (with binary/512KB protection)

## How to build
```bash
pnpm install                          # Install deps for all workspaces
pnpm build                            # Build all: core (tsc) → desktop (esbuild 3-target)
```
**Order matters:** core must compile first (tui and desktop depend on `@runnio/core`).

## How to run in development
```bash
pnpm dev:desktop                      # Build renderer + start Electron (DevTools opens auto)
pnpm dev:tui                          # Watch mode for TUI (tsc --watch)
```
Desktop uses `node scripts/build-renderer.mjs` which runs esbuild with 3 targets: main, preload, renderer.

## Architectural decisions
- **Terminal registry in main process** — ptys live in main, not renderer. 1000-chunk buffer for replay on reconnect. Terminals only die on explicit `terminal:close`, never on component unmount.
- **ALL agents mounted** — all Workspace components stay mounted (display:none/flex) to preserve xterm state. No unmount/remount.
- **Zustand with persist** — localStorage saves projects, activeProjectId, activeAgentId. Hydration guard in App.tsx.
- **Plugin system with priority** — agency-os(100) > bmad(90) > generic(10) > raw(0). Each detect() has 2s timeout. Config override via runnio.config.json.
- **Claude Code readiness detection** — main process listens to pty output for signals ("Welcome to Claude Code", "claude>", etc). When ready, injects pending prompt with 500ms delay.
- **External worktree sync** — polls every 3s comparing path snapshots. Worktrees created outside the app are detected and added as source: 'external'.
- **IPC serialization** — all objects pass through `JSON.parse(JSON.stringify())` before crossing the bridge. Dates and functions don't survive.
- **Frameless window** — titleBarStyle: 'hidden', frame: false. Custom TitleBar component with window controls.

## Data model

### Project
```typescript
{
  id: string                    // hash of rootPath
  name: string                  // repo folder name
  rootPath: string
  plugin: 'raw' | 'generic' | 'agency-os' | 'bmad'
  pluginContext?: any
  agents: AgentSession[]
  addedAt: number
  lastOpenedAt: number
}
```

### AgentSession
```typescript
{
  id: string                    // `${projectId}-${branch}`
  projectId: string
  branch: string
  worktreePath: string
  status: 'working' | 'waiting' | 'idle' | 'done'
  lastActivity?: number
  terminalId: string            // pty id in main process
  isTerminalAlive: boolean
  notes?: string
  tokenUsage?: { input: number; output: number; costUsd: number }
  source?: 'internal' | 'external'
  prUrl?: string
  prNumber?: number
}
```

## Plugin system
Detection by priority with fallback:
1. **agency-os** (100) — detects `agency/clients/` or `agency/{name}/profile.md`
2. **bmad** (90) — detects `.bmad/` or "bmad" in CLAUDE.md or `.claude/agents/`
3. **generic** (10) — detects `CLAUDE.md` at root
4. **raw** (0) — always matches (universal fallback)

Manual override: `plugin` field in `runnio.config.json`.

To add a plugin: implement `RunnioPlugin` (name, priority, detect, load) and call `registerPlugin()`.

## What NOT to do
- Do NOT use the name "agentflow" or "regent" for new code — the product is **Runnio**
- Do NOT make the repository public — it is proprietary
- Do NOT use JSX syntax — this project uses `React.createElement()` calls exclusively
- Do NOT hardcode paths with forward slashes — always use `path.join()` or `normalizePath()`
- Do NOT expose Node APIs directly to the renderer — always go through preload.ts
- Do NOT add external CSS frameworks — use the existing CSS variables system in index.html
- Do NOT use `JSON.stringify()` alone for IPC returns — always wrap with `JSON.parse(JSON.stringify())`
- Do NOT unmount Workspace components — all agents stay mounted with `display: none` to preserve terminal sessions
- Do NOT add JSX transpilation — esbuild config uses plain React.createElement

## Code conventions
- **React without JSX** — desktop uses `React.createElement()` directly, no JSX transpiler
- **Inline styles** — CSS via style objects, no CSS modules or styled-components
- **CSS variables** — colors defined in `index.html` (:root), referenced via `var(--name)`
- **TypeScript strict** — no implicit any, paths via `normalizePath()` from core
- **IPC naming** — `domain:action` (e.g. `git:list-worktrees`, `terminal:create`)
- **Error handling** — try/catch in every IPC handler, console.error with `[runnio]` prefix
- **Store access** — `useStore(s => s.field)` in components, `useStore.getState()` in event handlers

## Important caveats
- **Windows paths** — always use `normalizePath()` from core before Git/fs operations. Backslashes cause problems with simple-git.
- **node-pty ConPTY** — `useConpty: true` required on Windows. Without it, terminal doesn't render ANSI correctly.
- **IPC serialization** — objects crossing the bridge lose prototypes, Dates become strings, functions disappear. Always `JSON.parse(JSON.stringify())`.
- **Terminal unmount** — NEVER call `terminal:close` in useEffect cleanup. Terminals must persist across navigation. Only close on explicit agent removal.
- **Zustand hydration** — App.tsx has a guard that waits for localStorage hydration. Without it, state appears empty on first render.
- **esbuild 3 targets** — main.ts and preload.ts compile as CJS (Node), renderer compiles as ESM (browser). Don't mix imports.
- **simple-git in worktrees** — pass the worktree path, not the repo root. Each worktree has its own HEAD.
