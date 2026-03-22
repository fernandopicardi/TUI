import * as React from 'react'
import { useCallback, useState, useMemo, useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { ArrowLeft, Trash2, Columns2, Sparkles, Globe, X, Archive, RotateCcw } from 'lucide-react'
import Terminal from '../components/Terminal'
import GitHistory from '../components/GitHistory'
import UpgradeGate from '../components/UpgradeGate'
import MCPPanel from '../components/MCPPanel'
import RightPanel from '../components/RightPanel'
import AgentLaunchPanel, { buildLaunchCommand } from '../components/AgentLaunchPanel'
import { getProviderById, CLI_PROVIDERS } from '../data/providers'

type Tab = 'terminal' | 'history'

interface Props {
  agentId: string
}

// Regex to detect localhost URLs in terminal output
const LOCALHOST_RE = /https?:\/\/(?:localhost|127\.0\.0\.1):\d{3,5}/gi

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
  const isBrowserPreviewOpen = useStore(s => s.isBrowserPreviewOpen)
  const [activeTab, setActiveTab] = useState<Tab>('terminal')
  const [previewUrl, setPreviewUrl] = useState('')

  const terminalId = useMemo(() => {
    if (!agent) return ''
    return agent.terminalId
  }, [agent?.terminalId])

  // Clear initPrompt after pickup
  useEffect(() => {
    if (initPrompt && isActive) {
      const timer = setTimeout(() => useStore.getState().setInitPrompt(null), 100)
      return () => clearTimeout(timer)
    }
  }, [initPrompt, isActive])

  // Listen for localhost URLs in terminal output
  useEffect(() => {
    if (!agent?.hasLaunched || !terminalId) return
    const unsub = window.runnio.terminal.onOutput((id: string, data: string) => {
      if (id !== terminalId) return
      const matches = data.match(LOCALHOST_RE)
      if (matches && matches.length > 0) {
        const url = matches[matches.length - 1]
        useStore.getState().updateAgent(agentId, { detectedUrl: url })
        setPreviewUrl(url)
      }
    })
    return unsub
  }, [terminalId, agent?.hasLaunched, agentId])

  // Sync detected URL from agent
  useEffect(() => {
    if (agent?.detectedUrl && !previewUrl) {
      setPreviewUrl(agent.detectedUrl)
    }
  }, [agent?.detectedUrl])

  const handleBack = useCallback(() => {
    useStore.getState().setActiveAgent(null)
  }, [])

  const handleDelete = useCallback(() => {
    if (!agent || !project) return
    useStore.getState().openDeleteAgent(project.id, agent.id)
  }, [agent, project])

  const handleSplit = useCallback(() => {
    useStore.getState().toggleSplitMode()
  }, [])

  const handleArchiveToggle = useCallback(() => {
    if (!agent || !project) return
    if (agent.archived) {
      useStore.getState().unarchiveAgent(project.id, agent.id)
      useStore.getState().showToast('Agent restored', 'success')
    } else {
      useStore.getState().archiveAgent(project.id, agent.id)
      useStore.getState().showToast('Agent archived', 'success')
      useStore.getState().setActiveAgent(null)
    }
  }, [agent, project])

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

  // Provider info for info bar
  const provider = agent.providerId ? getProviderById(agent.providerId) : CLI_PROVIDERS[0]
  const modelLabel = agent.launchConfig?.model
    ? agent.launchConfig.model.replace('claude-', '').replace(/-/g, ' ')
    : 'default'

  // Time since last activity
  const getTimeSince = (ts?: number) => {
    if (!ts) return ''
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return `${s}s ago`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    return `${Math.floor(m / 60)}h ago`
  }

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', backgroundColor: 'var(--bg-app)' },
  },
    // Header — tabs + context + actions
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', height: '36px',
        borderBottom: '1px solid var(--border-default)', flexShrink: 0,
      },
    },
      React.createElement('button', {
        onClick: handleBack,
        style: {
          background: 'none', border: '1px solid var(--text-disabled)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)', padding: '2px 8px', cursor: 'pointer', fontSize: 'var(--text-sm)',
          transition: 'all 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-secondary)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-disabled)' },
      }, React.createElement(ArrowLeft, { size: 13 })),
      // Tabs (Terminal + History only)
      React.createElement('div', { style: { display: 'flex', gap: '2px' } },
        React.createElement('button', { onClick: () => setActiveTab('terminal'), style: tabStyle('terminal') }, 'Terminal'),
        React.createElement('button', { onClick: () => setActiveTab('history'), style: tabStyle('history') }, 'History'),
      ),
      // Context info — branch, status, time
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' },
      },
        React.createElement('span', {
          style: { fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Consolas, monospace' },
        }, agent.branch || 'detached'),
        React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: '11px' } }, '\u00B7'),
        React.createElement('span', {
          style: {
            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: statusColor,
          },
        },
          React.createElement('span', {
            style: {
              width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor,
              animation: agent.status === 'working' ? 'pulse 2s infinite' : agent.status === 'waiting' ? 'pulseFast 1s infinite' : 'none',
            },
          }),
          agent.status,
        ),
        agent.lastActivity
          ? React.createElement('span', {
              style: { fontSize: '10px', color: 'var(--text-disabled)' },
            }, getTimeSince(agent.lastActivity))
          : null,
      ),
      React.createElement('div', { style: { flex: 1 } }),
      // Detected URL pill
      agent.detectedUrl
        ? React.createElement('button', {
            onClick: () => {
              setPreviewUrl(agent.detectedUrl!)
              useStore.getState().toggleBrowserPreview()
            },
            style: {
              display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px',
              background: isBrowserPreviewOpen ? '#4ade8015' : 'var(--bg-elevated)',
              border: `1px solid ${isBrowserPreviewOpen ? 'var(--working)' : 'var(--border-default)'}`,
              borderRadius: '10px', color: isBrowserPreviewOpen ? 'var(--working)' : 'var(--text-tertiary)',
              fontSize: '10px', cursor: 'pointer', fontFamily: 'Consolas, monospace',
            },
          },
            React.createElement('span', {
              style: { width: '5px', height: '5px', borderRadius: '50%', background: 'var(--working)' },
            }),
            agent.detectedUrl.replace(/https?:\/\//, ''),
          )
        : null,
      React.createElement('button', {
        onClick: handleSplit,
        title: 'Split terminal (Ctrl+\\)',
        style: {
          background: 'none', border: '1px solid var(--text-disabled)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)', padding: '2px 8px', cursor: 'pointer', fontSize: 'var(--text-sm)',
          transition: 'all 100ms', display: 'flex', alignItems: 'center', gap: '3px',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-disabled)'; e.currentTarget.style.color = 'var(--text-secondary)' },
      }, React.createElement(Columns2, { size: 11 }), 'Split'),
      React.createElement('button', {
        onClick: handleArchiveToggle,
        title: agent.archived ? 'Restore agent' : 'Archive agent',
        style: {
          background: 'none', border: '1px solid var(--text-disabled)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)', padding: '2px 8px', cursor: 'pointer', fontSize: 'var(--text-sm)',
          transition: 'all 100ms', display: 'flex', alignItems: 'center', gap: '3px',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-disabled)'; e.currentTarget.style.color = 'var(--text-secondary)' },
      }, React.createElement(agent.archived ? RotateCcw : Archive, { size: 11 }), agent.archived ? ' Restore' : ' Archive'),
      React.createElement('button', {
        onClick: handleDelete,
        style: {
          background: 'none', border: '1px solid #f8717166', borderRadius: 'var(--radius-sm)',
          color: 'var(--error)', padding: '2px 8px', cursor: 'pointer', fontSize: 'var(--text-sm)',
          transition: 'all 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--error)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#f8717166' },
      }, React.createElement(Trash2, { size: 11 })),
    ),

    // Launch panel (shown before first launch)
    !agent.hasLaunched
      ? React.createElement('div', { style: { flex: 1, overflow: 'hidden' } },
          React.createElement(AgentLaunchPanel, {
            agent,
            projectName: project.name,
            onLaunch: (config) => {
              const command = buildLaunchCommand(config.model, config.mode, config.providerId)
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

    // Main content area (after launch)
    agent.hasLaunched
      ? React.createElement('div', {
          style: { flex: 1, display: 'flex', overflow: 'hidden' },
        },
          // Left: Terminal + History + Browser Preview
          React.createElement('div', {
            style: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
          },
            // Info bar — provider, model
            React.createElement('div', {
              style: {
                height: '28px', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '0 12px', borderBottom: '1px solid var(--border-subtle)',
                fontSize: '11px', color: 'var(--text-disabled)', flexShrink: 0,
              },
            },
              provider
                ? React.createElement('span', {
                    style: { display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' },
                  },
                    React.createElement(Sparkles, { size: 11, color: provider.color }),
                    React.createElement('span', null, provider.name),
                    React.createElement('span', { style: { color: 'var(--text-disabled)' } }, '\u00B7'),
                    React.createElement('span', null, modelLabel),
                  )
                : null,
              React.createElement('div', { style: { flex: 1 } }),
              React.createElement('span', {
                style: { fontSize: '10px', color: 'var(--text-disabled)' },
              }, project.name),
            ),

            // Terminal / History content
            React.createElement('div', {
              style: { flex: 1, overflow: 'hidden', position: 'relative' as const },
            },
              // Terminal (always mounted)
              React.createElement('div', {
                style: { position: 'absolute' as const, inset: 0, display: activeTab === 'terminal' ? 'block' : 'none' },
              },
                isBrowserPreviewOpen && previewUrl
                  ? React.createElement('div', {
                      style: { display: 'flex', flexDirection: 'column' as const, height: '100%' },
                    },
                      React.createElement('div', {
                        style: { flex: 6, overflow: 'hidden', minHeight: '100px' },
                      },
                        React.createElement(Terminal, {
                          id: terminalId,
                          worktreePath: agent.worktreePath,
                          initialPrompt: effectivePrompt,
                          visible: isActive && activeTab === 'terminal',
                        }),
                      ),
                      React.createElement('div', {
                        style: { height: '1px', background: 'var(--border-default)', flexShrink: 0 },
                      }),
                      React.createElement('div', {
                        style: { flex: 4, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', minHeight: '80px' },
                      },
                        React.createElement('div', {
                          style: {
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px',
                            borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
                          },
                        },
                          React.createElement(Globe, { size: 11, color: 'var(--text-disabled)' }),
                          React.createElement('input', {
                            value: previewUrl,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPreviewUrl(e.target.value),
                            style: {
                              flex: 1, padding: '2px 6px', background: 'var(--bg-app)', border: '1px solid var(--border-default)',
                              borderRadius: '3px', color: 'var(--text-primary)', fontSize: '11px', outline: 'none',
                              fontFamily: 'Consolas, monospace',
                            },
                          }),
                          React.createElement('button', {
                            onClick: () => useStore.getState().toggleBrowserPreview(),
                            style: {
                              background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', padding: '2px',
                            },
                          }, React.createElement(X, { size: 12 })),
                        ),
                        React.createElement('iframe', {
                          src: previewUrl,
                          style: { flex: 1, border: 'none', background: '#fff' },
                          sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
                        }),
                      ),
                    )
                  : React.createElement(Terminal, {
                      id: terminalId,
                      worktreePath: agent.worktreePath,
                      initialPrompt: effectivePrompt,
                      visible: isActive && activeTab === 'terminal',
                    }),
              ),
              // History
              React.createElement('div', {
                style: { position: 'absolute' as const, inset: 0, display: activeTab === 'history' ? 'flex' : 'none', flexDirection: 'column' as const },
              },
                React.createElement(UpgradeGate, { feature: 'gitHistoryFull' },
                  React.createElement(GitHistory, { worktreePath: agent.worktreePath, visible: activeTab === 'history' })
                ),
              ),
            ),
          ),
          // Right panel
          React.createElement(RightPanel, {
            worktreePath: agent.worktreePath,
            branch: agent.branch,
            rootPath: project.rootPath,
          }),
        )
      : null,

    // MCP Panel
    agent.hasLaunched
      ? React.createElement(UpgradeGate, { feature: 'mcpManager' },
          React.createElement(MCPPanel, { worktreePath: agent.worktreePath })
        )
      : null,
  )
}

export default Workspace
