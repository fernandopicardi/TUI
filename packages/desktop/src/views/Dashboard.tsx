import * as React from 'react'
import { useStore } from '../hooks/useStore'
import { usePluginLoader } from '../hooks/usePlugin'
import ContextPanel from '../components/ContextPanel/index'
import InitBanner from '../components/InitBanner'
import AgentStatusBadge from '../components/AgentStatusBadge'
import { INIT_PROMPTS } from '../data/initPrompts'

const Dashboard: React.FC = () => {
  const activeProject = useStore(s => {
    return s.projects.find(p => p.id === s.activeProjectId) ?? null
  })

  usePluginLoader()

  if (!activeProject) {
    return React.createElement('div', {
      style: {
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#555', fontSize: '13px',
      },
    }, 'Select a project in the sidebar')
  }

  const isRawPlugin = activeProject.plugin === 'raw'

  const handleInitTemplate = (template: string) => {
    const prompt = INIT_PROMPTS[template]
    if (!prompt) return
    const firstAgent = activeProject.agents[0]
    if (firstAgent) {
      useStore.getState().setInitPrompt(prompt)
      useStore.getState().setActiveAgent(firstAgent.id)
    }
  }

  return React.createElement('div', {
    style: {
      height: '100%', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
    },
  },
    // Project header
    React.createElement('div', {
      style: {
        padding: '16px 20px', borderBottom: '1px solid #1f1f1f',
        display: 'flex', alignItems: 'center', gap: '12px',
      },
    },
      React.createElement('h2', {
        style: { margin: 0, fontSize: '18px', fontWeight: 600, color: '#ededed' },
      }, activeProject.name),
      React.createElement('span', {
        style: {
          padding: '2px 8px', background: '#111', border: '1px solid #1f1f1f',
          borderRadius: '4px', fontSize: '11px', color: '#888',
        },
      }, activeProject.plugin),
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
          style: { fontSize: '13px', fontWeight: 600, color: '#888' },
        }, `Agents (${activeProject.agents.length})`),
        React.createElement('button', {
          onClick: () => useStore.getState().openCreateAgent(),
          style: {
            padding: '5px 12px', background: '#5b6af0', border: 'none',
            borderRadius: '6px', color: '#fff', fontSize: '12px',
            cursor: 'pointer', transition: 'opacity 0.15s',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.opacity = '0.85' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.opacity = '1' },
        }, '+ New agent'),
      ),

      activeProject.agents.length === 0
        ? React.createElement('div', {
            style: { color: '#555', fontSize: '13px', textAlign: 'center' as const, padding: '40px' },
          }, 'No agents yet. Create one to get started.')
        : React.createElement('div', {
            style: {
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            },
          },
            ...activeProject.agents.map(agent =>
              React.createElement('div', {
                key: agent.id,
                onClick: () => useStore.getState().setActiveAgent(agent.id),
                style: {
                  display: 'flex', flexDirection: 'column' as const, gap: '10px',
                  padding: '16px', backgroundColor: '#111',
                  border: '1px solid #1a1a1a', borderRadius: '8px',
                  cursor: 'pointer', transition: 'all 150ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
                  (e.currentTarget).style.borderColor = '#2a2a2a'
                },
                onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
                  (e.currentTarget).style.borderColor = '#1a1a1a'
                },
              },
                React.createElement('div', {
                  style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
                },
                  React.createElement(AgentStatusBadge, { status: agent.status }),
                ),
                React.createElement('div', {
                  style: { fontSize: '14px', fontWeight: 500, color: '#ededed', fontFamily: 'Consolas, monospace' },
                }, agent.branch || 'detached'),
                React.createElement('div', {
                  style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
                },
                  React.createElement('span', {
                    style: { color: '#444', fontSize: '11px' },
                  }, agent.worktreePath.split(/[\\/]/).pop()),
                  React.createElement('span', { style: { color: '#333', fontSize: '14px' } }, '\u2192'),
                ),
              )
            )
          )
    )
  )
}

export default Dashboard
