# agentflow

TUI para orquestrar múltiplos agentes Claude Code em paralelo.

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

## Configuração opcional
Crie `agentflow.config.json` na raiz do projeto para customizar comportamento.

```json
{
  "plugin": "agency-os",
  "agencyPath": "caminho/customizado/para/clients",
  "refreshInterval": 5000,
  "terminal": "wt"
}
```

## Plugins de contexto detectados automaticamente
- **Agency OS** — detecta estrutura `agency/clients/`
- **BMAD** — detecta estrutura `.bmad/` ou `.claude/agents/`
- **Generic** — detecta `CLAUDE.md`
- **Raw** — qualquer repo git (fallback)

## Atalhos
| Tecla | Ação |
|-------|------|
| `↑↓` | Navegar entre workspaces |
| `Enter` | Abrir workspace no terminal |
| `n` | Criar novo worktree |
| `d` | Deletar worktree selecionado |
| `r` | Forçar refresh |
| `q` | Sair |
