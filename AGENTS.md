# Runnio — Multi-Agent Coordination

Every agent must read this file before starting, update their status when starting and finishing, and check other agents' file ownership before touching any file.

## Agent 1 — Rename + Core Fixes
Branch: agent-1/rename-core
Status: Complete
Owns: all files (rename pass), electron/main.ts, src/store/index.ts, src/types.ts, src/features.ts, packages/core/*, packages/tui/*
Do NOT touch: src/components/GitHistory.tsx, src/utils/gitGraph.ts, src/components/AgentLaunchPanel.tsx, src/hooks/useSyntaxHighlight.ts, src/components/TasksPanel.tsx

## Agent 2 — UI/UX Polish + Tasks Tab
Branch: agent-2/ui-ux-tasks
Status: Complete (rebased onto main)
Owns: src/components/* (existing files), src/views/Welcome.tsx, src/views/Dashboard.tsx, src/components/TasksPanel.tsx (NEW)
Do NOT touch: electron/main.ts, src/store/index.ts, src/utils/gitGraph.ts, src/views/Workspace.tsx

## Agent 3 — Git History Tab
Branch: runnio-a3-git-history
Status: Complete
Owns: src/components/GitHistory.tsx (NEW), src/utils/gitGraph.ts (NEW), src/views/Workspace.tsx (ADD history tab only), electron/main.ts (ADD git:log, git:get-avatar, git:commit-files, git:checkout handlers only), electron/preload.ts (ADD new methods only)
Do NOT touch: src/store/index.ts, src/components/* (existing files)

## Agent 4 — Launch Panel + Syntax Highlighting
Branch: runnio-a4-launch-syntax
Status: Complete
Owns: src/components/AgentLaunchPanel.tsx (NEW), src/hooks/useSyntaxHighlight.ts (NEW), src/views/Workspace.tsx (ADD launch panel only), src/store/index.ts (ADD hasLaunched + launchConfig fields only)
Do NOT touch: electron/main.ts core handlers, src/utils/gitGraph.ts

## Merge order after all agents complete
1. Agent 1 first — rename affects all files
2. Agent 3 second — new files, minimal conflict
3. Agent 4 third — new files + small Workspace.tsx addition
4. Agent 2 last — UI polish on top of everything

## Shared rules
- Product name: Runnio (never agentflow, never regent)
- Config file: runnio.config.json
- Store key: runnio-store
- Dev mode: RUNNIO_DEV=true
- All UI strings in English only
- No hardcoded / path separators — always path.normalize()
- No bash or sh — always cmd or PowerShell on Windows
- All IPC returns must use JSON.parse(JSON.stringify())
