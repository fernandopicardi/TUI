import * as React from 'react'
import { useCallback, useState, useMemo, useRef } from 'react'
import { useStore } from '../hooks/useStore'
import Terminal from '../components/Terminal'
import DiffViewer from '../components/DiffViewer'
import PRPanel from '../components/PRPanel'
import FileTree from '../components/FileTree'
import MCPPanel from '../components/MCPPanel'
import WorkspaceNotes from '../components/WorkspaceNotes'
import GitHistory from '../components/GitHistory'
import UpgradeGate from '../components/UpgradeGate'
import AgentLaunchPanel, { buildLaunchCommand } from '../components/AgentLaunchPanel'
import SplitTerminalSelector from '../components/SplitTerminalSelector'
import CostTracker from '../components/CostTracker'

type Tab = 'terminal' | 'files' | 'diff' | 'history' | 'pr' | 'notes'

interface Props {
  agentId: string
}

const Workspace: React.FC<Props> = ({ agentId }) => {
  const agent = useStore(s => {
    for (const p of s.projects) {
      const a = p.agents.find(ag => ag.id === agentId)
      if (a) return a
    }
    return null
  })
  const project = useStore(s => {
    return s.projects.find(p => p.agents.some(a => a.id === agentId)) ?? null
  })
  const initPrompt = useStore(s => s.initPrompt)
  const isActive = useStore(s => s.activeAgentId === agentId)
  const splitAgentId = useStore(s => s.splitPairs[agentId] ?? null)
  const [activeTab, setActiveTab] = useState<Tab>('terminal')
  const [showSplitSelector, setShowSplitSelector] = useState(false)
  const splitBtnRef = useRef<HTMLButtonElement>(null)

  // Resolve split agent details
  const splitAgent = useStore(s => {
    if (!splitAgentId) return null
    for (const p of s.projects) {
      const a = p.agents.find(ag => ag.id === splitAgentId)
      if (a) return { agent: a, projectName: p.name }
    }
    return null
  })

  const terminalId = useMemo(() => {
    if (!agent) return ''
    return agent.terminalId
  }, [agent?.terminalId])

  // Clear initPrompt after pickup
  React.useEffect(() => {
    if (initPrompt && isActive) {
      const timer = setTimeout(() => useStore.getState().setInitPrompt(null), 100)
      return () => clearTimeout(timer)
    }
  }, [initPrompt, isActive])

  // Listen for Ctrl+\ toggle-split event (only on active workspace)
  React.useEffect(() => {
    if (!isActive || !agent?.hasLaunched) return
    const handler = () => {
      if (splitAgentId) {
        useStore.getState().clearSplit(agentId)
      } else {
        setShowSplitSelector(prev => !prev)
      }
    }
    window.addEventListener('runnio:toggle-split', handler)
    return () => window.removeEventListener('runnio:toggle-split', handler)
  }, [isActive, agentId, splitAgentId, agent?.hasLaunched])

  const handleBack = useCallback(() => {
    useStore.getState().setActiveAgent(null)
  }, [])

  const handleDelete = useCallback(() => {
    if (!agent || !project) return
    useStore.getState().openDeleteAgent(project.id, agent.id)
  }, [agent, project])

  const handleSplitSelect = useCallback((selectedAgent: any) => {
    useStore.getState().setSplitAgent(agentId, selectedAgent.id)
    setShowSplitSelector(false)
  }, [agentId])

  const handleCloseSplit = useCallback(() => {
    useStore.getState().clearSplit(agentId)
  }, [agentId])

  if (!agent || !project) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-base)' },
    }, 'Agent not found')
  }

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    background: 'transparent', border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    padding: '4px 12px', cursor: 'pointer',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 'var(--text-sm)',
    transition: 'all 150ms',
  })

  const effectivePrompt = isActive ? (initPrompt || undefined) : undefined

  const statusColor = agent.status === 'working' ? 'var(--working)'
    : agent.status === 'waiting' ? 'var(--waiting)'
    : agent.status === 'done' ? 'var(--done)'
    : 'var(--text-disabled)'

  const isSplit = !!splitAgent

  // Split icon SVG (two columns)
  const splitIcon = React.createElement('svg', {
    width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none',
    style: { display: 'block' },
  },
    React.createElement('rect', { x: 1, y: 1, width: 6, height: 14, rx: 1.5, stroke: 'currentColor', strokeWidth: 1.5 }),
    React.createElement('rect', { x: 9, y: 1, width: 6, height: 14, rx: 1.5, stroke: 'currentColor', strokeWidth: 1.5 }),
  )

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', backgroundColor: 'var(--bg-app)' },
  },
    // Row 1 — Navigation: back, breadcrumb, status, actions
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px', height: '36px',
        borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
      },
    },
      // Back button
      React.createElement('button', {
        onClick: handleBack,
        title: 'Back to Dashboard',
        style: {
          background: 'none', border: 'none', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-tertiary)', padding: '2px 6px', cursor: 'pointer', fontSize: 'var(--text-sm)',
          transition: 'all 100ms', display: 'flex', alignItems: 'center',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-primary)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-tertiary)' },
      }, '\u2190'),
      // Breadcrumb: Project > Branch
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '6px' },
      },
        React.createElement('button', {
          onClick: handleBack,
          title: 'Back to project dashboard',
          style: {
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)',
            transition: 'color 100ms',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--accent)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-tertiary)' },
        }, project.name),
        React.createElement('span', {
          style: { color: 'var(--text-disabled)', fontSize: '10px' },
        }, '/'),
        React.createElement('span', {
          style: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', fontFamily: '"Cascadia Code", Consolas, monospace' },
        }, agent.branch || 'detached'),
      ),
      // Status badge
      React.createElement('span', {
        style: {
          display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: statusColor,
          padding: '1px 8px', borderRadius: '10px',
          background: agent.status === 'working' ? 'rgba(74,222,128,0.08)'
            : agent.status === 'waiting' ? 'rgba(251,191,36,0.08)'
            : agent.status === 'done' ? 'rgba(99,102,241,0.08)'
            : 'transparent',
        },
      },
        React.createElement('span', {
          style: {
            width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusColor,
            animation: agent.status === 'working' ? 'pulse 2s infinite' : agent.status === 'waiting' ? 'pulseFast 1s infinite' : 'none',
          },
        }),
        agent.status,
      ),
      // Cost tracker (compact) — gated by feature flag
      agent.hasLaunched && agent.tokenUsage
        ? React.createElement(CostTracker, { usage: agent.tokenUsage, variant: 'compact' })
        : null,
      React.createElement('div', { style: { flex: 1 } }),
      // Split terminal button
      agent.hasLaunched
        ? React.createElement('button', {
            ref: splitBtnRef,
            onClick: () => {
              if (isSplit) {
                handleCloseSplit()
              } else {
                setShowSplitSelector(prev => !prev)
              }
            },
            title: isSplit ? 'Close split view (Ctrl+\\)' : 'Split terminal (Ctrl+\\)',
            style: {
              display: 'flex', alignItems: 'center', gap: '5px',
              background: isSplit ? 'rgba(99,102,241,0.12)' : 'none',
              border: isSplit ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: isSplit ? 'var(--accent)' : 'var(--text-tertiary)',
              padding: '3px 8px', cursor: 'pointer', fontSize: 'var(--text-xs)',
              transition: 'all 120ms',
            },
            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
              if (!isSplit) {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              }
            },
            onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
              if (!isSplit) {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }
            },
          },
            splitIcon,
            isSplit ? 'Unsplit' : 'Split',
          )
        : null,
      // Delete button
      React.createElement('button', {
        onClick: handleDelete,
        title: 'Delete agent',
        style: {
          background: 'none', border: 'none', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-disabled)', padding: '2px 6px', cursor: 'pointer', fontSize: 'var(--text-sm)',
          transition: 'all 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--error)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
      }, '\u2715'),
    ),

    // Row 2 — Tabs
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', padding: '0 16px', height: '32px',
        borderBottom: '1px solid var(--border-default)', flexShrink: 0,
        gap: '2px',
      },
    },
      React.createElement('button', { onClick: () => setActiveTab('terminal'), style: tabStyle('terminal') }, 'Terminal'),
      React.createElement('button', { onClick: () => setActiveTab('files'), style: tabStyle('files') }, 'Files'),
      React.createElement('button', { onClick: () => setActiveTab('diff'), style: tabStyle('diff') }, 'Diff'),
      React.createElement('button', { onClick: () => setActiveTab('history'), style: tabStyle('history') }, 'History'),
      React.createElement('button', { onClick: () => setActiveTab('pr'), style: tabStyle('pr') }, 'PR'),
      React.createElement('button', { onClick: () => setActiveTab('notes'), style: tabStyle('notes') }, 'Notes'),
    ),

    // Split selector popover
    showSplitSelector
      ? React.createElement(SplitTerminalSelector, {
          currentAgentId: agentId,
          anchorRef: splitBtnRef as React.RefObject<HTMLElement>,
          onSelect: handleSplitSelect,
          onClose: () => setShowSplitSelector(false),
        })
      : null,

    // Launch panel (shown before first launch)
    !agent.hasLaunched
      ? React.createElement('div', { style: { flex: 1, overflow: 'hidden' } },
          React.createElement(AgentLaunchPanel, {
            agent,
            projectName: project.name,
            onLaunch: (config) => {
              const command = buildLaunchCommand(config.model, config.mode)
              useStore.getState().setAgentLaunched(agent.id, config)
              window.runnio.terminal.create(agent.terminalId, agent.worktreePath, command)
                .then(() => {
                  if (config.initialPrompt) {
                    window.runnio.terminal.injectWhenReady(agent.terminalId, config.initialPrompt)
                  }
                })
            },
          })
        )
      : null,

    // Tab content (hidden until launched)
    agent.hasLaunched ? React.createElement('div', { style: { flex: 1, overflow: 'hidden', position: 'relative' as const } },
      // Terminal tab — with split support
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'terminal' ? 'flex' : 'none', flexDirection: 'row' as const },
      },
        // Left pane (current agent terminal)
        React.createElement('div', {
          style: {
            flex: 1,
            position: 'relative' as const,
            minWidth: 0,
            borderRight: isSplit ? '1px solid var(--border-default)' : 'none',
          },
        },
          // Pane label (only when split)
          isSplit
            ? React.createElement('div', {
                style: {
                  position: 'absolute' as const, top: 0, left: 0, right: 0,
                  height: '24px', zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 8px',
                  backgroundColor: 'rgba(10,10,10,0.85)',
                  backdropFilter: 'blur(4px)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '10px',
                },
              },
                React.createElement('span', {
                  style: { color: 'var(--text-secondary)', fontFamily: '"Cascadia Code", Consolas, monospace' },
                }, agent.branch),
                React.createElement('span', {
                  style: {
                    width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusColor,
                  },
                }),
              )
            : null,
          React.createElement('div', {
            style: {
              position: 'absolute' as const, left: 0, right: 0,
              top: isSplit ? '24px' : 0, bottom: 0,
            },
          },
            React.createElement(Terminal, {
              id: terminalId,
              worktreePath: agent.worktreePath,
              initialPrompt: effectivePrompt,
            }),
          ),
        ),

        // Right pane (split agent terminal)
        isSplit && splitAgent
          ? React.createElement('div', {
              style: {
                flex: 1,
                position: 'relative' as const,
                minWidth: 0,
              },
            },
              // Split pane header
              React.createElement('div', {
                style: {
                  position: 'absolute' as const, top: 0, left: 0, right: 0,
                  height: '24px', zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 8px',
                  backgroundColor: 'rgba(10,10,10,0.85)',
                  backdropFilter: 'blur(4px)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '10px',
                },
              },
                React.createElement('div', {
                  style: { display: 'flex', alignItems: 'center', gap: '6px' },
                },
                  React.createElement('span', {
                    style: { color: 'var(--text-secondary)', fontFamily: '"Cascadia Code", Consolas, monospace' },
                  }, splitAgent.agent.branch),
                  React.createElement('span', {
                    style: { color: 'var(--text-disabled)', fontSize: '9px' },
                  }, splitAgent.projectName),
                ),
                React.createElement('div', {
                  style: { display: 'flex', alignItems: 'center', gap: '6px' },
                },
                  // Status dot
                  React.createElement('span', {
                    style: {
                      width: '5px', height: '5px', borderRadius: '50%',
                      backgroundColor:
                        splitAgent.agent.status === 'working' ? 'var(--working)' :
                        splitAgent.agent.status === 'waiting' ? 'var(--waiting)' :
                        splitAgent.agent.status === 'done' ? 'var(--done)' :
                        'var(--text-disabled)',
                    },
                  }),
                  // Swap button
                  React.createElement('button', {
                    onClick: () => {
                      // Swap: navigate to split agent and split with current
                      useStore.getState().clearSplit(agentId)
                      useStore.getState().setActiveAgent(splitAgent.agent.id)
                      useStore.getState().setSplitAgent(splitAgent.agent.id, agentId)
                    },
                    title: 'Swap panes',
                    style: {
                      background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                      color: 'var(--text-disabled)', fontSize: '11px', lineHeight: 1,
                      transition: 'color 100ms',
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--accent)' },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
                  }, '\u21C4'),
                  // Close split button
                  React.createElement('button', {
                    onClick: handleCloseSplit,
                    title: 'Close split',
                    style: {
                      background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                      color: 'var(--text-disabled)', fontSize: '11px', lineHeight: 1,
                      transition: 'color 100ms',
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--error)' },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
                  }, '\u2715'),
                ),
              ),
              // Split terminal
              React.createElement('div', {
                style: {
                  position: 'absolute' as const, left: 0, right: 0,
                  top: '24px', bottom: 0,
                },
              },
                React.createElement(Terminal, {
                  id: splitAgent.agent.terminalId,
                  worktreePath: splitAgent.agent.worktreePath,
                }),
              ),
            )
          : null,
      ),
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'files' ? 'flex' : 'none' },
      },
        React.createElement(FileTree, { worktreePath: agent.worktreePath })
      ),
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'diff' ? 'flex' : 'none', flexDirection: 'column' as const },
      },
        React.createElement(DiffViewer, { worktreePath: agent.worktreePath, visible: activeTab === 'diff' })
      ),
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'history' ? 'flex' : 'none', flexDirection: 'column' as const },
      },
        React.createElement(UpgradeGate, { feature: 'gitHistoryFull' },
          React.createElement(GitHistory, { worktreePath: agent.worktreePath, visible: activeTab === 'history' })
        )
      ),
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'pr' ? 'block' : 'none', overflow: 'auto' as const },
      },
        React.createElement(UpgradeGate, { feature: 'prFlow' },
          React.createElement(PRPanel, { worktreePath: agent.worktreePath, branch: agent.branch })
        )
      ),
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'notes' ? 'block' : 'none' },
      },
        React.createElement(UpgradeGate, { feature: 'sessionNotes' },
          React.createElement(WorkspaceNotes, { branch: agent.branch, rootPath: project.rootPath })
        )
      ),
    ) : null,

    // MCP Panel
    agent.hasLaunched
      ? React.createElement(UpgradeGate, { feature: 'mcpManager' },
          React.createElement(MCPPanel, { worktreePath: agent.worktreePath })
        )
      : null,
  )
}

export default Workspace
