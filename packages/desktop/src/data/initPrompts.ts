export const INIT_PROMPTS: Record<string, string> = {
  auto: `Analyze this project and identify which Runnio structure makes the most sense to configure.

Available options:
- Agency OS: for agencies with multiple clients, CRO loops, hypotheses, and A/B tests
- BMAD: for development projects with specialized agents (PM, Architect, Dev, QA)
- Generic: for any project that wants persistent context between Claude Code sessions

Analyze existing files, the project stack, and overall context. Suggest the best option with justification and initialize the chosen structure after my confirmation.`,

  agencyOS: `Configure the Agency OS structure in this project.

Create the following folders and files:
- agency/clients/ (client folder)
- agency/clients/example/ (example client for reference)
- agency/clients/example/profile.md (profile template)
- agency/clients/example/hypothesis-log.md (hypothesis template)
- agency/clients/example/active-tests.md (active tests template)
- agency/clients/example/winners.md (winners template)
- agency/portfolio-wins.md (cross-client library)
- runnio.config.json with plugin: "agency-os"
- CLAUDE.md with agency context

Before creating, ask me: agency name, and whether I have a first client to add.`,

  bmad: `Configure the BMAD structure in this project.

Analyze the current project (stack, existing files, package.json if any) and configure:
- CLAUDE.md with project context and agent instructions
- .bmad/ with agent configuration
- Story and sprint structure appropriate for the project
- runnio.config.json with plugin: "bmad"

Before creating, ask me: project name, type (web app / API / mobile / other) and main stack.`,

  generic: `Configure generic Runnio structure in this project.

Create:
- CLAUDE.md with: project description, stack, code conventions, important commands, context for agents
- runnio.config.json with basic configuration

Before creating, analyze existing files to auto-populate CLAUDE.md with real project information.`,
}
