# Runnio Changelog

## v0.1.2 — 2026-03-20

### Added
- Git History tab with SVG bezier graph, Code and People modes, virtual scroll
- Pre-terminal config panel with model and mode selection
- Syntax highlighting in Files and Diff tabs (highlight.js)
- Sidebar Tasks tab with GitHub Issues integration
- Feature flags system with UpgradeGate component
- Developer mode bypass (RUNNIO_DEV=true)
- Delete agent modal with worktree removal and branch deletion options
- Filter pills in Tasks tab (All, By project, By agent)
- AgentBar attention state with pulsing border for waiting agents (2+ min)
- Dashboard plugin badges (Agency OS, BMAD, Generic, Raw)
- Escape key handler to close Git History detail panel
- Copy commit hash button in Git History detail panel

### Fixed
- Worktree creation now produces populated sibling folders
- Projects that fail to open now show clear error messages
- Init banner now appears correctly for projects without Runnio structure
- Agent worktreePath correctly set to worktree path instead of rootPath
- Contrast and visibility throughout the app — replaced all hardcoded dim colors with CSS variables
- CSS variables updated for better readability (text-secondary #888→#a8a8a8, text-tertiary #555→#6b6b6b)
- Border visibility improved (border-default #1f1f1f→#2a2a2a)
- Status colors made more vibrant (working, waiting, done, error)
- Inactive tab labels now use text-secondary for clear readability
- AgentBar project name contrast improved (text-tertiary→text-secondary)

### Changed
- Renamed from agentflow/Regent to Runnio throughout
- Added proprietary LICENSE file
- Accent color updated to #6366f1 for better vibrancy
- All hardcoded colors replaced with CSS variable references

## v0.1.1 — 2026-03-19

### Added
- Initial Electron desktop app with multi-project support
- 6 workspace tabs: Terminal, Files, Diff, History, PR, Notes
- Persistent terminal sessions via node-pty with buffer replay
- Claude Code readiness detection and automatic prompt injection
- Broadcast prompts with QuickPrompt
- MCP server manager
- Settings modal with General, GitHub, and Config tabs
- External worktree sync (auto-detect worktrees created outside app)
- Plugin system with auto-detection (Agency OS, BMAD, Generic, Raw)
- Command palette with keyboard navigation
