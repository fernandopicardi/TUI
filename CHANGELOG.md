# Runnio Changelog

## v0.1.7 — 2026-03-22

### Added
- **Right Panel**: Collapsible 420px side panel in workspace with Files, Diff, PR, Notes, and Changes tabs. Controlled by toolbar toggle buttons. Smooth CSS transition (200ms ease-out).
- **Changes tab**: Real-time git status view with modified/staged/untracked/deleted file lists, "Stage All" and "Commit" buttons with inline message input. Auto-refreshes every 5s.
- **Browser preview**: Split terminal view (60/40) with iframe preview when localhost URL detected. URL bar with manual navigation. Toggleable via toolbar button.
- **Localhost detection**: Terminal output scanned for localhost/127.0.0.1 URL patterns. Detected URL shown as pill in workspace header. Click to open preview.
- **Info bar**: 28px bar below tabs showing provider icon, model name, and project name. Provides persistent agent context.
- **Toolbar Diff toggle**: New GitCompareArrows icon in toolbar to open right panel on Diff tab.
- **Git IPC handlers**: `git:working-status` (modified/staged/untracked/deleted), `git:stage-all`, `git:commit-changes` via simple-git.

### Changed
- **Workspace restructured**: Terminal and History are now the only main tabs. Files, Diff, PR, Notes moved to the collapsible right panel. Terminal gets the full workspace width when panel is closed.
- **Toolbar icons**: Active state now uses `var(--accent)` color instead of `var(--text-primary)`. Changes icon uses GitBranch instead of Menu.
- **Store rightPanelTab type**: Expanded from `'files' | 'changes' | 'info'` to `'files' | 'diff' | 'pr' | 'notes' | 'changes'`.

## v0.1.6 — 2026-03-22

### Fixed
- **Git History bezier curves**: Merge curves now converge at the commit dot (cy) instead of overshooting to row bottom. Branch-off curves diverge from the commit dot downward. Both use proper S-curve control points with vertical tangents at endpoints.
- **Agent commit detection**: Now checks Co-Authored-By lines in commit body (catches Claude Code's standard `Co-Authored-By: Claude` pattern), author name patterns, and cross-references against known agent branches in the store. Previously only checked email patterns, causing all commits to appear as "Human commits".
- **Active lanes computation**: Extended neighbor range from ±1 to ±2 for more accurate vertical line rendering at merge/branch points.
- **DiffViewer hooks crash**: Moved `highlightedLines` useMemo above early returns to fix "Rendered more hooks than during the previous render" error.

### Added
- **Agent vs human visual distinction**: Agent commits show diamond nodes (filled) in SVG graph, colored provider avatars (Claude=amber, Copilot=green, Cursor=purple, Codex=emerald), and subtle lane-color background tint. Human commits show outlined circle nodes with Gravatar/initials avatars.
- **Avatar system**: Provider-colored circle with initial for agents (C, GH, Cu, Cd, Cx). Hue-based initials fallback for humans when Gravatar unavailable. Avatar group component (overlapping, up to 3) for merge commit displays.
- **People mode swimlanes**: Agents section at top with Bot icon header, Contributors section below with User icon header. Each section shows commit counts. Agent entries display provider badge.
- **Detail panel enhancements**: Agent/Human badge, Merge badge with parent count, agent info card with branch name, merge info card with parent hashes, file change stats (+X -Y per file), Lucide icons for Copy/Check/Checkout/GitBranch actions.
- **File change statistics**: `git:commit-files` IPC handler now returns additions/deletions per file via `git diff-tree --numstat`, displayed in detail panel.
- **Agent creation improvements**: Updated Claude models to 4.6 (Opus 4.6, Sonnet 4.6), added "Default" option that runs `claude` without `--model` flag, fixed provider selection to actually use the selected provider's command.

### Known limitations
- Repos with 1000+ commits may show slower initial load (500 commit cap applies)
- Filtered views (search/branch/type) may show slightly imprecise lane lines between non-adjacent commits
- Avatar group currently shows in People mode headers; detail panel uses single avatar

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
