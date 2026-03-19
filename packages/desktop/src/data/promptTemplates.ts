export interface PromptTemplate {
  id: string
  label: string
  description: string
  prompt: string
  plugin: 'agency-os' | 'bmad' | 'generic' | 'all'
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Agency OS
  { id: 'cro-loop', label: 'Iniciar loop de CRO', description: 'Analisa Clarity e gera hip\u00F3teses', plugin: 'agency-os',
    prompt: 'Inicie o loop de CRO para este cliente:\n1. Conecte ao Clarity via MCP e analise os \u00FAltimos 30 dias\n2. Identifique os 3 maiores friction points\n3. Gere hip\u00F3teses baseadas nos dados\n4. Proponha varia\u00E7\u00F5es para teste A/B\n5. Atualize o hypothesis-log.md' },
  { id: 'implement-winner', label: 'Implementar winner', description: 'Implementa varia\u00E7\u00E3o vencedora', plugin: 'agency-os',
    prompt: 'Verifique o arquivo winners.md e implemente a varia\u00E7\u00E3o vencedora mais recente:\n1. Leia winners.md para identificar o winner pendente\n2. Implemente as mudan\u00E7as\n3. Fa\u00E7a commit com mensagem descritiva\n4. Atualize winners.md marcando como implementado' },
  { id: 'client-status', label: 'Status do cliente', description: 'Resumo do estado atual', plugin: 'agency-os',
    prompt: 'Gere um resumo do estado atual deste cliente:\n1. Leia profile.md, active-tests.md, hypothesis-log.md e winners.md\n2. Resuma: testes ativos, hip\u00F3teses pendentes, winners implementados\n3. Identifique pr\u00F3ximos passos recomendados' },
  // BMAD
  { id: 'sprint-start', label: 'Iniciar sprint', description: 'Planeja e inicia novo sprint', plugin: 'bmad',
    prompt: 'Inicie o planejamento do pr\u00F3ximo sprint:\n1. Revise o backlog atual\n2. Estime story points\n3. Defina o sprint goal\n4. Crie o arquivo de sprint com hist\u00F3rias priorizadas' },
  { id: 'code-review', label: 'Code review', description: 'Revisa c\u00F3digo do worktree', plugin: 'bmad',
    prompt: 'Fa\u00E7a um code review completo das mudan\u00E7as neste branch:\n1. Analise todos os arquivos modificados\n2. Verifique: qualidade, performance, seguran\u00E7a, testes\n3. Aponte issues cr\u00EDticos e sugest\u00F5es' },
  // Generic
  { id: 'update-claude-md', label: 'Atualizar CLAUDE.md', description: 'Atualiza contexto do projeto', plugin: 'generic',
    prompt: 'Analise o estado atual do projeto e atualize o CLAUDE.md:\n1. Revise a estrutura de arquivos\n2. Atualize comandos importantes\n3. Adicione decis\u00F5es arquiteturais recentes' },
  // All
  { id: 'commit-push', label: 'Commit e push', description: 'Commita e faz push', plugin: 'all',
    prompt: 'Fa\u00E7a commit e push de todas as mudan\u00E7as pendentes:\n1. Revise os arquivos modificados\n2. Agrupe em commits l\u00F3gicos\n3. Escreva mensagens seguindo conventional commits\n4. Fa\u00E7a push para o remote' },
  { id: 'fix-bugs', label: 'Encontrar e corrigir bugs', description: 'Analisa e corrige problemas', plugin: 'all',
    prompt: 'Analise o projeto em busca de bugs e corrija-os:\n1. Rode os testes existentes\n2. Analise logs de erro\n3. Corrija os bugs encontrados\n4. Adicione testes para os bugs corrigidos' },
]
