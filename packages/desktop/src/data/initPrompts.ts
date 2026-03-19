export const INIT_PROMPTS: Record<string, string> = {
  auto: `Analise este projeto e identifique qual estrutura agentflow faz mais sentido configurar.

Opções disponíveis:
- Agency OS: para agências com múltiplos clientes, loops de CRO, hipóteses e testes A/B
- BMAD: para projetos de desenvolvimento com agentes especializados (PM, Arquiteto, Dev, QA)
- Generic: para qualquer projeto que queira contexto persistente entre sessões Claude Code

Analise os arquivos existentes, a stack do projeto e o contexto geral. Sugira a melhor opção com justificativa e inicialize a estrutura escolhida após minha confirmação.`,

  agencyOS: `Configure a estrutura Agency OS neste projeto.

Crie as seguintes pastas e arquivos:
- agency/clients/ (pasta para clientes)
- agency/clients/exemplo/ (cliente de exemplo para referência)
- agency/clients/exemplo/profile.md (template de perfil)
- agency/clients/exemplo/hypothesis-log.md (template de hipóteses)
- agency/clients/exemplo/active-tests.md (template de testes ativos)
- agency/clients/exemplo/winners.md (template de winners)
- agency/portfolio-wins.md (biblioteca cross-client)
- agentflow.config.json com plugin: "agency-os"
- CLAUDE.md com contexto da agência

Antes de criar, me pergunte: nome da agência, e se já tenho um primeiro cliente para adicionar.`,

  bmad: `Configure a estrutura BMAD neste projeto.

Analise o projeto atual (stack, arquivos existentes, package.json se houver) e configure:
- CLAUDE.md com contexto do projeto e instruções para agentes
- .bmad/ com configuração dos agentes
- Estrutura de stories e sprints adequada ao projeto
- agentflow.config.json com plugin: "bmad"

Antes de criar, me pergunte: nome do projeto, tipo (web app / API / mobile / outro) e stack principal.`,

  generic: `Configure estrutura genérica agentflow neste projeto.

Crie:
- CLAUDE.md completo com: descrição do projeto, stack, convenções de código, comandos importantes, contexto para agentes
- agentflow.config.json com configurações básicas

Antes de criar, analise os arquivos existentes para popular o CLAUDE.md automaticamente com informações reais do projeto.`,
}
