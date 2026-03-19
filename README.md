# agentflow

TUI para orquestrar múltiplos agentes Claude Code em paralelo, com Git worktrees isolados e detecção automática de contexto por projeto.

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

## Instalação

```bash
npm install -g github:fernandopicardi/TUI
```

## Uso

```bash
cd seu-projeto
agentflow
```

## Atualizar

```bash
npm install -g github:fernandopicardi/TUI
```

## Atalhos

| Tecla | Ação |
|-------|------|
| `↑` `↓` | Navegar entre workspaces |
| `Enter` | Abrir workspace no terminal com Claude Code |
| `n` | Criar novo worktree (cria branch + abre terminal) |
| `d` | Deletar worktree selecionado (com confirmação) |
| `r` | Forçar refresh de worktrees e status |
| `q` | Sair |

## Plugins de contexto

O agentflow detecta automaticamente a estrutura do projeto e ativa um painel de contexto relevante. Plugins são verificados em ordem de prioridade — o primeiro que detectar positivo é ativado.

### Agency OS (prioridade: 30)

**Detecta quando:**
- Existe pasta `agency/clients/` na raiz do projeto
- Existe pasta `agency/` com subpastas contendo `profile.md`

**Mostra:** lista de clientes com status (loop ativo, aguardando, winner pronto), contagem de hipóteses pendentes.

### BMAD (prioridade: 20)

**Detecta quando:**
- Existe pasta `.bmad/` na raiz
- `CLAUDE.md` contém menção a "BMAD" ou "bmad"
- Existe pasta `.claude/agents/`

**Mostra:** agentes detectados e fase atual do workflow (se detectável via `.bmad/status.md`).

### Generic (prioridade: 10)

**Detecta quando:**
- Existe arquivo `CLAUDE.md` na raiz

**Mostra:** nome do projeto (extraído da primeira linha do CLAUDE.md), número de worktrees.

### Raw (prioridade: 0, fallback)

**Sempre disponível.** Ativado quando nenhum plugin mais específico detecta.

**Mostra:** nome do repositório, branch atual, número de worktrees.

## `agentflow.config.json`

Arquivo opcional na raiz do projeto para customizar comportamento:

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

| Opção | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `plugin` | `string` | auto-detect | Força um plugin específico, pulando detecção automática |
| `agencyPath` | `string` | `agency/clients` | Caminho customizado para o plugin Agency OS |
| `refreshInterval` | `number` | `3000` | Frequência de refresh dos worktrees em ms |
| `terminal` | `"wt"` \| `"cmd"` | auto-detect | Força terminal específico (Windows Terminal ou CMD) |
| `maxVisibleWorkspaces` | `number` | `8` | Máximo de cards visíveis antes de scrollar |
| `showTimestamps` | `boolean` | `true` | Exibir "modificado há Xs" nos cards |
| `openCommand` | `string` | `"claude"` | Comando executado ao abrir workspace |

## Adicionar novo plugin

Plugins seguem a interface `AgentflowPlugin`:

```typescript
// src/plugins/types.ts
export interface AgentflowPlugin {
  name: string                                    // identificador único
  priority: number                                // maior = mais prioritário
  detect(rootPath: string): Promise<boolean>      // detecção (timeout: 2s)
  load(rootPath: string): Promise<PluginContext>   // carrega dados (timeout: 2s)
  Panel: React.FC<{ context: PluginContext }>      // componente de renderização
}

export interface PluginContext {
  pluginName: string
  summary: string
  data: Record<string, unknown>
}
```

### Passo a passo

1. Crie a pasta `src/plugins/meu-plugin/`
2. Crie `detect.ts` com a lógica de detecção (retorna `true`/`false`)
3. Crie `panel.tsx` com o componente React (Ink) para renderizar o painel
4. Crie `index.ts` exportando o plugin com nome, prioridade, detect, load e Panel
5. Registre em `src/plugins/registry.ts` importando e adicionando ao array `plugins`

### Exemplo mínimo

```typescript
// src/plugins/meu-plugin/index.ts
import { AgentflowPlugin, PluginContext } from '../types.js'
import MeuPanel from './panel.js'

const meuPlugin: AgentflowPlugin = {
  name: 'meu-plugin',
  priority: 15,
  async detect(rootPath) {
    // Sua lógica de detecção aqui
    return false
  },
  async load(rootPath) {
    return { pluginName: 'meu-plugin', summary: 'Resumo', data: {} }
  },
  Panel: MeuPanel,
}

export default meuPlugin
```

**Importante:**
- `detect()` e `load()` têm timeout de 2 segundos. Se exceder, o plugin é ignorado.
- Se `load()` falhar, o agentflow faz fallback para o plugin `raw`.
- Use as funções de `utils/fs.ts` e `utils/paths.ts` — nunca `path.join()` direto ou `/` hardcoded.
- Use `splitLines()` para quebrar conteúdo de arquivos (trata `\r\n` e `\n`).

## Troubleshooting

### "Nenhum repositório git encontrado neste diretório"

Execute `agentflow` dentro de um diretório que é (ou está dentro de) um repositório git.

### Windows Terminal (`wt`) não abre

O agentflow tenta Windows Terminal primeiro, depois faz fallback para CMD automaticamente. Se quiser forçar um, configure no `agentflow.config.json`:

```json
{ "terminal": "cmd" }
```

### "Claude Code não encontrado"

Claude Code precisa estar instalado globalmente:

```bash
npm install -g @anthropic-ai/claude-code
```

Ou configure um comando alternativo:

```json
{ "openCommand": "code" }
```

### Worktree aparece como "[removido]"

O path do worktree não existe mais no disco. Isso acontece se a pasta foi deletada manualmente. Use `d` para limpar o registro do git.

### JSON inválido no `agentflow.config.json`

O agentflow ignora o arquivo e usa defaults. Um warning aparece no stderr.

### Muitos worktrees na tela

Configure `maxVisibleWorkspaces` para limitar quantos cards são visíveis. A lista scrolla automaticamente ao navegar.

```json
{ "maxVisibleWorkspaces": 5 }
```

### Timestamps não atualizam

Os timestamps atualizam a cada 5 segundos. Se `showTimestamps` estiver `false` no config, eles ficam ocultos.

### Plugin não é detectado

1. Verifique se os arquivos/pastas esperados existem (veja seção Plugins de contexto)
2. Force o plugin via config: `{ "plugin": "agency-os" }`
3. Plugins têm timeout de 2 segundos — se a detecção for lenta, o plugin é ignorado

## Stack

- **TypeScript** — tipagem estrita
- **Ink 4.x** — React para terminal
- **simple-git** — operações git (nunca exec direto)
- **execa** — spawn de processos (Windows-safe)
- **chokidar** — file watching para detecção de atividade
- **ink-text-input** / **ink-select-input** — componentes de input
- **ink-spinner** — indicadores de loading

## Licença

MIT
