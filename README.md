# agentflow

Orquestre múltiplos agentes Claude Code em paralelo, com Git worktrees isolados e detecção automática de contexto por projeto.

```
┌──────────────────────────────────────────────────────┐
│  ⬡ agentflow                                         │
│                                                      │
│  ◆ Agency OS — 3 cliente(s) ativo(s)                 │
│  ├ client-acme       ● loop ativo                    │
│  ├ client-techco     ○ aguardando                    │
│  └ client-store      ✓ winner pronto                 │
│  ──────────────────────────────────────────────────   │
│                                                      │
│  ╭──────────────────────────────────────────────────╮ │
│  │  ● working   main (main)                        │ │
│  │              modificado há 8s                    │ │
│  ╰──────────────────────────────────────────────────╯ │
│  ╭──────────────────────────────────────────────────╮ │
│  │  ● working   feature/auth-backend               │ │
│  │              modificado há 3s                    │ │
│  ╰──────────────────────────────────────────────────╯ │
│  ╭──────────────────────────────────────────────────╮ │
│  │  ○ idle      feature/landing-page               │ │
│  ╰──────────────────────────────────────────────────╯ │
│                                                      │
│  [↑↓] navegar  [enter] abrir  [n] novo  [d] deletar │
│  [r] refresh  [q] sair                               │
└──────────────────────────────────────────────────────┘
```

## Arquitetura

Monorepo com pnpm workspaces:

```
agentflow/
├── packages/
│   ├── core/       ← lógica compartilhada (git, plugins, agents, config)
│   ├── tui/        ← app TUI (Ink/React terminal)
│   └── desktop/    ← app Electron (MVP)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

| Package | Descrição |
|---------|-----------|
| `@agentflow/core` | Git worktrees, plugin system, agent status, config loader |
| `@agentflow/tui` | TUI com Ink 4.x — `agentflow` CLI global |
| `@agentflow/desktop` | Electron app — dark mode, sidebar, terminal integrado |

## Instalação

### TUI (CLI)

```bash
pnpm install -g github:fernandopicardi/TUI
```

### Desktop

```bash
cd packages/desktop
pnpm build:win
# Installer em release/
```

## Uso

```bash
cd seu-projeto
agentflow
```

## Build (desenvolvimento)

```bash
pnpm install
pnpm build          # compila core + tui + desktop
pnpm dev:tui        # watch mode TUI
pnpm dev:desktop    # watch mode Electron
```

## Atalhos (TUI)

| Tecla | Ação |
|-------|------|
| `↑` `↓` | Navegar entre workspaces |
| `Enter` | Abrir workspace no terminal com Claude Code |
| `n` | Criar novo worktree |
| `d` | Deletar worktree selecionado |
| `r` | Forçar refresh |
| `q` | Sair |

## Atalhos (Desktop)

| Tecla | Ação |
|-------|------|
| `Ctrl+N` | Novo worktree |
| `Ctrl+W` | Fechar workspace |
| `Ctrl+R` | Refresh |

## Plugins de contexto

Plugins detectam automaticamente a estrutura do projeto e ativam painéis relevantes.

| Plugin | Prioridade | Detecta quando |
|--------|-----------|----------------|
| Agency OS | 100 | `agency/clients/` ou subpastas com `profile.md` |
| BMAD | 90 | `.bmad/`, "BMAD" em CLAUDE.md, ou `.claude/agents/` |
| Generic | 10 | `CLAUDE.md` na raiz |
| Raw | 0 | Sempre (fallback) |

## `agentflow.config.json`

```json
{
  "plugin": "agency-os",
  "agencyPath": "caminho/customizado/para/clients",
  "refreshInterval": 3000,
  "terminal": "wt",
  "maxVisibleWorkspaces": 8,
  "showTimestamps": true,
  "openCommand": "claude"
}
```

## Stack

- **TypeScript** — tipagem estrita
- **pnpm workspaces** — monorepo
- **Ink 4.x** — React para terminal (TUI)
- **Electron 28** — app desktop
- **React 18** — UI
- **Zustand** — estado (desktop)
- **simple-git** — operações git
- **chokidar** — file watching

## Licença

MIT
