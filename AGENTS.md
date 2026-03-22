# Runnio — Multi-Agent Coordination

Every agent must read this file before starting, update their status when starting and finishing, and check other agents' file ownership before touching any file.

## Completed work (v0.1.2 — 2026-03-20)

### Agent 1 — Rename + Core Fixes
Branch: agent-1/rename-core (merged to main)
- Renamed entire codebase from agentflow/regent to Runnio
- Updated all package names, config files, UI strings, localStorage keys
- Added proprietary LICENSE file
- Fixed worktree creation, error messages, init banner

### Agent 2 — UI/UX Polish + Tasks Tab
Branch: runnio-a2-ui-tasks (merged to main)
- Added Sidebar Tasks tab with GitHub Issues integration
- Added filter pills (All, By project, By agent)
- Added delete agent modal with worktree removal + branch deletion
- Polished hover/active/focus states across all interactive elements
- Added Dashboard plugin badges

### Agent 3 — Git History Tab
Branch: runnio-a3-git-history (merged to main)
- Added GitHistory component with SVG bezier graph
- Code mode with virtual scroll (36px rows) and People mode with author grouping
- Detail panel with file list, commit info, copy hash, checkout
- Escape key handler, UpgradeGate integration
- gitGraph.ts utility with lane assignment algorithm

### Agent 4 — Launch Panel + Syntax Highlighting
Branch: runnio-a4-launch-syntax (merged to main)
- Added AgentLaunchPanel with model dropdown (3 Claude models)
- Plan mode (--plan) and auto-accept (--dangerously-skip-permissions)
- hasLaunched tracking in store with persistence migration
- highlight.js integration with 15 languages
- Syntax highlighting in Files tab and Diff viewer

### QA Pass + Contrast Fix (Prompt A)
Branch: main (direct)
- Full QA audit: all 33 checklist items verified PASS
- CSS variables updated for improved contrast and visibility
- All hardcoded dim colors replaced with CSS variable references
- Documentation updated (STATUS.md, CONTEXT.md, AGENTS.md, CHANGELOG.md)

## Agent slots (available for next session)

### Agent C — Multi-Provider + Toolbar Redesign + Global Terminal + Homepage
Branch: agent-c/multi-provider-toolbar-home
Status: Complete — ready to merge
Owns: TitleBar.tsx, App.tsx, src/views/Home.tsx, src/data/providers.ts, src/types.ts (additive), electron/main.ts (new handlers only)

### Agent B — Settings Redesign + CLI Detection + Theme System + History Graph Fix
Branch: agent-b/settings-cli-history
Status: Complete — ready to merge
Owns: SettingsModal.tsx, src/utils/gitGraph.ts, src/styles/ (theme tokens), electron/main.ts (CLI detection handlers only)

### Agent Fix-1 — Foundation: Icons, Theme, Plan Gates
Branch: fix-1/foundation-icons-theme
Status: Complete — ready to merge
Owns: All component files (icon replacements), index.html (CSS vars), features.ts (plan default), themes.ts, store/index.ts (theme default)

### Agent Fix-2 — Git History Deep Rework
Branch: fix-2/git-history-deep
Status: Complete — ready to merge
Owns: GitHistory.tsx, gitGraph.ts, main.ts (git:commit-files handler)

### Agent 4 — [Not assigned]
Branch: (TBD)
Status: Not started
Owns: (TBD)

## Shared rules
- Product name: Runnio (never agentflow, never regent)
- Config file: runnio.config.json
- Store key: runnio-store
- Dev mode: RUNNIO_DEV=true
- All UI strings in English only
- No hardcoded / path separators — always path.normalize()
- No bash or sh — always cmd or PowerShell on Windows
- All IPC returns must use JSON.parse(JSON.stringify())
- Use CSS variables for all colors — no hardcoded hex in components
- Inactive tab labels must use var(--text-secondary), not var(--text-tertiary)
- Empty state messages must use var(--text-secondary) for readability
