import * as React from 'react'
import { useStore } from '../hooks/useStore'
import { usePluginLoader } from '../hooks/usePlugin'
import ContextPanel from '../components/ContextPanel/index'
import InitBanner from '../components/InitBanner'
import AgentStatusBadge from '../components/AgentStatusBadge'
import { INIT_PROMPTS } from '../data/initPrompts'

const PLUGIN_BADGES: Record<string, { label: string; color: string }> = {
  'agency-os': { label: 'Agency OS', color: '#7c3aed' },
  'bmad': { label: 'BMAD', color: '#f59e0b' },
  'generic': { label: 'Generic', color: 'var(--accent)' },
  'raw': { label: 'Raw', color: 'var(--text-disabled)' },
}

const Dashboard: React.FC = () => {
  const activeProject = useStore(s => {
    return s.projects.find(p => p.id === s.activeProjectId) ?? null
  })

  usePluginLoader()

  if (!activeProject) {
    return React.createElement('div', {
      style: {
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-tertiary)', fontSize: 'var(--text-base)',
      },
    }, 'Select a project in the sidebar')
  }

  const isRawPlugin = activeProject.plugin === 'raw'

  const handleInitTemplate = (template: string) => {
    const prompt = INIT_PROMPTS[template]
    if (!prompt) return
    const firstAgent = activeProject.agents[0]
    if (firstAgent) {
      useStore.getState().updateProject(activeProject.id, {
        pluginContext: undefined as any,
      })
      useStore.getState().setInitPrompt(prompt)
      useStore.getState().setActiveAgent(firstAgent.id)
    }
  }

  const getTimeSince = (lastActivity?: number) => {
    if (!lastActivity) return 'no recent activity'
    const seconds = Math.floor((Date.now() - lastActivity) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  const getStatusLabel = (status: string) => {
    if (status === 'waiting') return 'needs attention'
    return status
  }

  const pluginBadge = PLUGIN_BADGES[activeProject.plugin] || PLUGIN_BADGES.raw

  return React.createElement('div', {
    style: {
      height: '100%', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
    },
  },
    // Project header
    React.createElement('div', {
      style: {
        padding: '16px 20px', borderBottom: '1px solid var(--border-default)',
        display: 'flex', alignItems: 'center', gap: '12px',
      },
    },
      React.createElement('h2', {
        style: { margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' },
      }, activeProject.name),
      // Plugin badge
      React.createElement('span', {
        style: {
          fontSize: '10px', fontWeight: 600, padding: '2px 8px',
          borderRadius: '10px', border: `1px solid ${pluginBadge.color}44`,
          color: pluginBadge.color, letterSpacing: '0.03em',
        },
      }, pluginBadge.label),
      React.createElement('span', {
        style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' },
      }, '\u00B7'),
      React.createElement('span', {
        style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontFamily: 'Consolas, monospace' },
      }, activeProject.rootPath),
      React.createElement('div', { style: { flex: 1 } }),
      React.createElement('button', {
        onClick: () => useStore.getState().openCreateAgent(),
        style: {
          padding: '5px 12px', background: 'var(--accent)', border: 'none',
          borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 'var(--text-sm)',
          cursor: 'pointer', transition: 'opacity 150ms, transform 80ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'scale(0.98)' },
        onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'scale(1)' },
      }, '+ New agent'),
    ),

    // Context panel (for configured plugins)
    !isRawPlugin && activeProject.pluginContext
      ? React.createElement(ContextPanel, {
          pluginName: activeProject.plugin,
          context: activeProject.pluginContext,
        })
      : null,

    // Init banner (for raw/unconfigured projects)
    isRawPlugin
      ? React.createElement(InitBanner, { onSelect: handleInitTemplate })
      : null,

    // Agents grid
    React.createElement('div', {
      style: {
        flex: 1, padding: '16px', overflowY: 'auto' as const,
      },
    },
      React.createElement('div', {
        style: {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '12px',
        },
      },
        React.createElement('span', {
          style: { fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-secondary)' },
        }, `Agents (${activeProject.agents.length})`),
      ),

      activeProject.agents.length === 0
        ? React.createElement('div', {
            style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-base)', textAlign: 'center' as const, padding: '40px' },
          }, 'No agents yet. Create one to get started.')
        : React.createElement('div', {
            style: {
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            },
          },
            ...activeProject.agents.map(agent => {
              const borderTopColor = agent.status === 'working' ? 'var(--working)'
                : agent.status === 'waiting' ? 'var(--waiting)'
                : agent.status === 'done' ? 'var(--done)'
                : 'var(--border-default)'

              return React.createElement('div', {
                key: agent.id,
                onClick: () => useStore.getState().setActiveAgent(agent.id),
                style: {
                  display: 'flex', flexDirection: 'column' as const, gap: '10px',
                  padding: '12px', backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)',
                  borderTop: `3px solid ${borderTopColor}`,
                  cursor: 'pointer', transition: 'transform 150ms, border-color 150ms, background 100ms',
                  animation: agent.status === 'waiting' ? 'glowWaiting 2s infinite' : 'none',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.background = 'var(--bg-hover)'
                },
                onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'var(--bg-elevated)'
                },
              },
                React.createElement('div', {
                  style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
                },
                  React.createElement(AgentStatusBadge, { status: agent.status }),
                  React.createElement('span', {
                    style: { fontSize: '11px', color: 'var(--text-tertiary)' },
                  }, getTimeSince(agent.lastActivity)),
                ),
                React.createElement('div', {
                  style: { fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Consolas, monospace' },
                }, agent.branch || 'detached'),
                React.createElement('div', {
                  style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
                },
                  React.createElement('span', {
                    style: {
                      color: agent.status === 'working' ? 'var(--working)'
                        : agent.status === 'waiting' ? 'var(--waiting)'
                        : 'var(--text-disabled)',
                      fontSize: '11px',
                    },
                  }, getStatusLabel(agent.status)),
                  React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: '14px' } }, '\u2192'),
                ),
              )
            })
          )
    )
  )
}

export default Dashboard
