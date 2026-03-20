# agentflow — Project Status Report

> Last updated: 2026-03-19

## Overview

**agentflow** is a Windows Electron desktop app for orchestrating multiple Claude Code agents in parallel across multiple Git projects using worktrees.

**Version:** 0.1.1
**Stack:** Electron 28 + React 18 + Zustand + xterm.js + node-pty
**Build:** esbuild (3-target: main/preload/renderer) + electron-builder (NSIS + portable)

---

## Feature Status

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-project store (Zustand + persist) | DONE | localStorage persistence with hydration guard |
| Terminal persistence | DONE | Dual mechanism: DOM all-mounted + main process registry |
| Init prompt timing | DONE | Claude Code readiness detection via output signals |
| Worktree sync (external) | DONE | Polls every 3s, auto-adds/removes agents for external worktrees |
| Broadcast to multiple agents | DONE | QuickPrompt with target selector (active/project/all) |
| PR Flow with GitHub API | DONE | 3-step flow (files → form → done), real `gh` API |
| MCP Panel (real config) | DONE | Reads/writes ~/.claude/settings.json and .claude/settings.json |
| Settings Modal | DONE | 3 tabs: General, GitHub, Config. Ctrl+, shortcut |
| Agent status polling | DONE | Polls all agents every 2s via @agentflow/core |
| Command Palette | DONE | Ctrl+K, searches agents/projects/actions |
| Quick Prompt | DONE | Ctrl+Space, history, templates, broadcast |
| Paste support | DONE | Ctrl+V + right-click paste in terminal |
| Branch validation | DONE | git-check-ref-format rules |
| Clone repository | DONE | 3-step modal with progress animation |
| Keyboard shortcuts | DONE | Ctrl+N, Ctrl+K, Ctrl+Space, Ctrl+,, Ctrl+W, Escape |
| Window controls | DONE | Custom titlebar with minimize/maximize/close |

### UX/UI

| Feature | Status | Notes |
|---------|--------|-------|
| CSS variables system | DONE | Full design token system in :root |
| Dark theme | DONE | Consistent dark palette across all components |
| Status badges | DONE | working (green pulse), waiting (yellow fast pulse), idle, done |
| Agent attention system | DONE | Waiting >2min gets glow animation |
| Empty states | DONE | All views have clear empty states with actions |
| Micro-interactions | DONE | Hover, active, focus states on all interactive elements |
| Toast notifications | DONE | Stacked, slide-in animation, auto-dismiss |
| Modal animations | DONE | fadeIn/fadeOut with translateY |
| Responsive agent cards | DONE | Grid layout with hover lift effect |
| External agent badge | DONE | ⬡ icon for worktrees created outside app |
| English UI | DONE | All strings translated from PT to EN |

### Architecture

| Component | Lines | Purpose |
|-----------|-------|---------|
| electron/main.ts | ~420 | IPC handlers, terminal registry, worktree watchers |
| electron/preload.ts | ~95 | Context bridge API exposure |
| src/types.ts | ~120 | Domain types + AgentflowAPI interface |
| src/store/index.ts | ~182 | Zustand store with persist |
| src/App.tsx | ~165 | Root layout, hydration, modal management |
| src/views/Welcome.tsx | ~100 | First-run screen |
| src/views/Dashboard.tsx | ~150 | Project overview with agent cards |
| src/views/Workspace.tsx | ~155 | Tabbed workspace (Terminal/Diff/PR/Notes) |
| src/components/Terminal.tsx | ~140 | xterm.js + pty bridge |
| src/components/Sidebar.tsx | ~165 | Project tree navigation |
| src/components/AgentBar.tsx | ~145 | Horizontal status bar |
| src/components/QuickPrompt.tsx | ~175 | Broadcast-capable prompt modal |
| src/components/PRPanel.tsx | ~195 | Real GitHub PR creation |
| src/components/MCPPanel.tsx | ~220 | MCP server manager |
| src/components/SettingsModal.tsx | ~230 | Settings with 3 tabs |
| src/components/CommandPalette.tsx | ~143 | Searchable command palette |
| src/hooks/useWorktreeSync.ts | ~52 | External worktree detection |

---

## Known Limitations

1. **Cost tracker** — Not implemented. `tokenUsage` field exists in AgentSession but no UI or data collection.
2. **GitHub PR** — Requires manual token in agentflow.config.json. No OAuth flow.
3. **MCP status** — Shows configured servers but cannot detect if they're actually running (Claude Code controls that).
4. **Agent status detection** — Relies on @agentflow/core `detectAgentStatus` which uses file heuristics, not direct Claude Code communication.
5. **Single window** — No multi-window support yet.
6. **No auto-update** — Users must manually download new versions.

---

## Build Artifacts

- `release/agentflow Setup 0.1.0.exe` — NSIS installer
- `release/agentflow 0.1.0.exe` — Portable executable
- `release/win-unpacked/` — Unpacked build directory

---

## Development

```bash
# Build renderer + main + preload
node scripts/build-renderer.mjs

# Run in dev mode
npx electron .

# Build installer + portable
npx electron-builder --win
```

---

## TODO / Future Work

- [ ] Cost tracker UI (read token usage from Claude Code output)
- [ ] GitHub OAuth flow (instead of manual token)
- [ ] Auto-update via electron-updater
- [ ] Multi-window support
- [ ] Linux/macOS builds
- [ ] Plugin marketplace
- [ ] Agent-to-agent communication
- [ ] Session recording/replay
- [ ] Diff viewer with syntax highlighting
- [ ] PR review comments inline
