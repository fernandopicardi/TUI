# Runnio Changelog

## v0.1.5 — 2026-03-21

### Added
- Lucide React icon library — all emojis/unicode UI icons replaced with consistent SVG icons throughout
- Icon sizing standard: 16px inline, 18px toolbar, 20px primary actions

### Changed
- Default theme changed from Dark (#0a0a0a) to Dark Navy (#0d1117) for better contrast and usability
- Default plan changed from 'free' to 'pro' for all users until billing system is implemented (deliberate beta decision)
- DEV mode now unlocks 'business' tier instead of 'enterprise' (team features in dev, pro features for all users)
- All hardcoded #0a0a0a background colors replaced with CSS variables or Dark Navy values
- Terminal xterm.js theme updated to Dark Navy colors
- Sidebar version bumped to v0.1.4

### Fixed
- UpgradeGate no longer blocks Git History, PR flow, Notes, MCP manager, and broadcast prompts for non-paying users

## v0.1.4 — 2026-03-21

### Added
- Multi-provider support: Claude Code, Codex, Gemini, OpenCode, Amp, Aider, Continue, Cline
- Provider selector in agent launch panel with live command preview
- Toolbar redesign with toggle icons for file explorer, browser preview, changes panel
- Global Terminal: access multiple project directories simultaneously
- Homepage: active agents, projects overview, recent activity
- Navigation history: back/forward arrows in toolbar

### Changed
- AgentLaunchPanel now shows detected providers only
- TitleBar reorganized with functional icon toolbar

## v0.1.3 — 2026-03-20

### Added
- Theme system: Dark, Dark Navy, Light, System modes
- Settings redesign: 6-section left-nav layout (General, Agents, Integrations, Repository, Interface, Account)
- CLI agent detection: auto-detects 9 providers (Claude Code, Codex, Gemini, OpenCode, Amp, Cursor, Cline, Continue, Aider)
- Branch name pattern configuration with live preview
- Repository settings section (auto-push, worktree location)
- Interface section with color mode selector, terminal font options, keyboard shortcuts reference
- Account section with GitHub token management and developer mode indicator

### Fixed
- Git History bezier curves now render at merge and branch points (was only drawing vertical lines)
- Contrast improvements: updated CSS variable defaults for better visibility
- Hardcoded color values replaced with CSS variables in GitHistory search input
- Sidebar inactive project labels now use text-secondary for better contrast

### Changed
- Settings modal expanded from 3-tab layout to 6-section left-nav sidebar
- CSS variables updated: text-tertiary #6b6b6b to #707070, text-disabled #3a3a3a to #444444, borders improved

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
