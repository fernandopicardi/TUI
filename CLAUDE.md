# agentflow

## O que é
Orquestrador multi-projeto de agentes Claude Code para Windows, usando Git worktrees para isolamento de branches e terminais persistentes via node-pty.

## Arquitetura do monorepo

```
packages/core     — Lógica compartilhada (Git, plugins, agents, config). CJS, sem React/UI.
packages/tui      — CLI com Ink 4.x (React terminal). ESM, type: module.
packages/desktop  — App Electron 28 (React 18 + Zustand + xterm.js + node-pty + esbuild).
```

### @agentflow/core — exports principais
- **Git:** `listWorktrees`, `createWorktree`, `removeWorktree`, `watchWorktrees`, `getCurrentBranch`
- **Utils:** `normalizePath`, `joinPath`, `resolvePath`, `getRepoRoot`, `getRepoName`, `pathExists`, `fileExists`, `readFileSafe`, `withTimeout`
- **Agents:** `detectAgentStatus`, `getRunningNodeProcesses`
- **Config:** `loadConfig`
- **Plugins:** `resolvePlugin`, `loadPluginSafe`, `registerPlugin`
- **Readers:** `readClients` (Agency OS), `readBmadData` (BMAD)

### @agentflow/desktop — IPC channels
- `dialog:open-directory` — seletor de pasta com validação de repo Git
- `git:*` — list-worktrees, create-worktree, remove-worktree, get-current-branch, watch-worktrees, watch-project-worktrees, clone
- `agent:get-status` — detecta working/waiting/idle/done por mtime de arquivos
- `plugin:load` — resolve + load plugin com timeout 2s
- `terminal:*` — create (com buffer replay), input, resize, close, get-buffer, is-alive, inject-when-ready
- `github:*` — get-diff (simple-git status + show), create-pr (GitHub REST API com token)
- `mcp:*` — get-config (global + project), add-server, remove-server
- `settings:*` — read/write global (~/.agentflow/config.json) e project (agentflow.config.json)
- `files:*` — list (tree recursivo com git status), read (com proteção binário/512KB)

## Como buildar
```bash
pnpm install                          # Instala deps de todos os workspaces
pnpm build                            # Build all: core (tsc) → desktop (esbuild 3-target)
```
**Ordem importa:** core deve compilar primeiro (tui e desktop dependem de `@agentflow/core`).

## Como rodar em desenvolvimento
```bash
pnpm dev:desktop                      # Build renderer + inicia Electron (DevTools abre auto)
pnpm dev:tui                          # Watch mode para TUI (tsc --watch)
```
O desktop usa `node scripts/build-renderer.mjs` que roda esbuild com 3 targets: main, preload, renderer.

## Decisões arquiteturais tomadas
- **Terminal registry no main process** — ptys vivem no main, não no renderer. Buffer de 1000 chunks para replay ao reconectar. Terminals só morrem em `terminal:close` explícito, nunca em unmount de componente.
- **ALL agents mounted** — todos os Workspace components ficam montados (display:none/flex) para preservar estado do xterm. Sem unmount/remount.
- **Zustand com persist** — localStorage salva projects, activeProjectId, activeAgentId. Hydration guard no App.tsx.
- **Plugin system com prioridade** — agency-os(100) > bmad(90) > generic(10) > raw(0). Cada detect() tem timeout 2s. Config override via agentflow.config.json.
- **Claude Code readiness detection** — main process escuta output do pty procurando sinais ("Welcome to Claude Code", "claude>", etc). Quando pronto, injeta prompt pendente com 500ms delay.
- **Worktree sync externo** — poll a cada 3s compara snapshot de paths. Worktrees criados fora do app são detectados e adicionados como source: 'external'.
- **IPC serialization** — todos os objetos passam por `JSON.parse(JSON.stringify())` antes de cruzar a bridge. Dates e funções não sobrevivem.
- **Frameless window** — titleBarStyle: 'hidden', frame: false. Custom TitleBar component com window controls.

## Modelo de dados

### Project
```typescript
{
  id: string                    // hash do rootPath
  name: string                  // nome da pasta do repo
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
  terminalId: string            // id do pty no main process
  isTerminalAlive: boolean
  notes?: string
  tokenUsage?: { input: number; output: number; costUsd: number }
  source?: 'internal' | 'external'
  prUrl?: string
  prNumber?: number
}
```

## Plugin system
Detecção por prioridade com fallback:
1. **agency-os** (100) — detecta `agency/clients/` ou `agency/{name}/profile.md`
2. **bmad** (90) — detecta `.bmad/` ou "bmad" no CLAUDE.md ou `.claude/agents/`
3. **generic** (10) — detecta `CLAUDE.md` na raiz
4. **raw** (0) — sempre match (fallback universal)

Override manual: campo `plugin` no `agentflow.config.json`.

Para adicionar plugin: implementar `AgentflowPlugin` (name, priority, detect, load) e chamar `registerPlugin()`.

## Estado atual do MVP (v0.1.1)

### Funcionando
- Multi-projeto com sidebar e troca rápida
- Criação/remoção de worktrees via Git
- Terminais persistentes com node-pty + xterm.js (buffer replay)
- Claude Code readiness detection + init prompt injection
- Worktree sync externo (poll 3s)
- Agent status detection (working/waiting/idle por mtime)
- Plugin detection (4 plugins built-in)
- Diff viewer (files + inline diff via simple-git)
- PR creation via GitHub REST API (push + create PR)
- MCP config viewer/editor (global + project scope)
- Settings modal (general, GitHub token test, project config)
- Command palette (Ctrl+K)
- Quick prompt broadcast (active/project/all agents)
- File tree viewer com git status indicators
- Toast notifications
- Custom frameless window com title bar
- Windows native notifications

### Placeholders / gaps conhecidos
- Cost tracker — campo `tokenUsage` existe no model mas sem UI de coleta
- GitHub OAuth — usa token manual, sem flow OAuth
- MCP runtime status — mostra config mas não detecta se servidor está rodando
- Agent status — heurística por mtime de arquivos, não comunicação direta com Claude Code
- Auto-update — não implementado, download manual
- Multi-window — single window only

### Próximas prioridades
- Estabilizar terminal lifecycle (edge cases de reconexão)
- Melhorar UX de criação de agente (templates, prompts sugeridos)
- Token/cost tracking real
- Diff viewer melhorado (syntax highlighting)
- Temas customizáveis

## Convenções de código
- **React sem JSX** — desktop usa `React.createElement()` direto, sem transpiler JSX
- **Inline styles** — CSS via objetos style, sem CSS modules ou styled-components
- **CSS variables** — cores definidas em `index.html` (:root), referenciadas via `var(--name)`
- **TypeScript strict** — sem any implícito, paths via `normalizePath()` do core
- **IPC naming** — `domain:action` (ex: `git:list-worktrees`, `terminal:create`)
- **Error handling** — try/catch em todo IPC handler, console.error com prefixo `[agentflow]`
- **Store access** — `useStore(s => s.field)` em componentes, `useStore.getState()` em event handlers

## Cuidados importantes
- **Windows paths** — sempre usar `normalizePath()` do core antes de operações Git/fs. Backslashes causam problemas com simple-git.
- **node-pty ConPTY** — `useConpty: true` obrigatório no Windows. Sem isso, terminal não renderiza ANSI corretamente.
- **IPC serialization** — objetos que cruzam a bridge perdem protótipos, Dates viram strings, funções somem. Sempre `JSON.parse(JSON.stringify())`.
- **Terminal unmount** — NUNCA chamar `terminal:close` em cleanup de useEffect. Terminals devem persistir entre navegações. Só fechar em remoção explícita de agente.
- **Zustand hydration** — App.tsx tem guard que espera hidratação do localStorage. Sem isso, estado aparece vazio no primeiro render.
- **esbuild 3 targets** — main.ts e preload.ts compilam como CJS (Node), renderer compila como ESM (browser). Não misturar imports.
- **simple-git em worktrees** — passar o path do worktree, não da raiz do repo. Cada worktree tem seu próprio HEAD.
