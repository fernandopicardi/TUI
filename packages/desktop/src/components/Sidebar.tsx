import * as React from 'react'
import { useState } from 'react'
import { useStore } from '../store/index'
import AgentStatusBadge from './AgentStatusBadge'

const Sidebar: React.FC = () => {
  const projects = useStore(s => s.projects)
  const activeProjectId = useStore(s => s.activeProjectId)
  const activeAgentId = useStore(s => s.activeAgentId)
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)

  return React.createElement('aside', {
    style: {
      width: '220px', minWidth: '220px', backgroundColor: '#080808',
      borderRight: '1px solid #1a1a1a', display: 'flex',
      flexDirection: 'column' as const, height: '100%', overflow: 'hidden',
    },
  },
    // Logo header
    React.createElement('div', {
      style: { padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: '8px' },
    },
      React.createElement('span', { style: { color: '#5b6af0', fontSize: '12px' } }, '\u25C6'),
      React.createElement('span', { style: { color: '#ededed', fontSize: '12px', fontWeight: 600 } }, 'agentflow'),
    ),

    // Project tree
    React.createElement('div', {
      style: {
        flex: 1, overflowY: 'auto' as const, padding: '0 8px',
        display: 'flex', flexDirection: 'column' as const, gap: '8px',
      },
    },
      ...projects.map(project => {
        const isActiveProject = project.id === activeProjectId
        const agents = project.agents

        return React.createElement('div', {
          key: project.id,
          onMouseEnter: () => setHoveredProject(project.id),
          onMouseLeave: () => setHoveredProject(null),
        },
          // Project header
          React.createElement('div', {
            style: {
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 8px', cursor: 'pointer',
            },
            onClick: () => useStore.getState().setActiveProject(project.id),
          },
            React.createElement('span', {
              style: {
                fontSize: '11px', color: isActiveProject ? '#888' : '#555',
                textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600,
              },
            }, project.name),
            // Actions (visible on hover)
            React.createElement('div', {
              style: {
                display: 'flex', gap: '4px',
                opacity: hoveredProject === project.id ? 1 : 0,
                transition: 'opacity 0.1s',
              },
            },
              React.createElement('button', {
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation()
                  useStore.getState().setActiveProject(project.id)
                  useStore.getState().openCreateAgent()
                },
                style: {
                  background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                  fontSize: '11px', padding: '0 2px',
                },
                title: 'New agent',
              }, '+'),
              React.createElement('button', {
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation()
                  if (confirm(`Remove project "${project.name}"?`)) {
                    project.agents.forEach(a => {
                      window.agentflow?.terminal?.close(a.terminalId)
                    })
                    useStore.getState().removeProject(project.id)
                  }
                },
                style: {
                  background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                  fontSize: '11px', padding: '0 2px',
                },
                title: 'Remove project',
              }, '\u00D7'),
            )
          ),

          // Agents list
          ...agents.map((agent, i) => {
            const isActive = agent.id === activeAgentId
            const isLast = i === agents.length - 1
            const prefix = isLast ? '\u2514' : '\u251C'

            return React.createElement('button', {
              key: agent.id,
              onClick: () => useStore.getState().setActiveAgent(agent.id),
              style: {
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', background: isActive ? '#161622' : 'transparent',
                border: 'none', borderLeft: isActive ? '2px solid #5b6af0' : '2px solid transparent',
                borderRadius: '0 4px 4px 0', cursor: 'pointer',
                transition: 'all 0.1s', width: '100%', textAlign: 'left' as const,
              },
              onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isActive) (e.currentTarget).style.background = '#111'
              },
              onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isActive) (e.currentTarget).style.background = 'transparent'
              },
            },
              React.createElement('span', {
                style: { color: '#333', fontSize: '11px', width: '12px', flexShrink: 0 },
              }, prefix),
              React.createElement(AgentStatusBadge, { status: agent.status }),
              React.createElement('span', {
                style: {
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                  color: isActive ? '#ededed' : '#aaa', fontSize: '12px',
                  fontFamily: 'Consolas, monospace',
                },
                title: agent.branch,
              }, agent.branch || 'detached'),
            )
          })
        )
      })
    ),

    // Add project button
    React.createElement('div', { style: { padding: '8px' } },
      React.createElement('button', {
        onClick: () => useStore.getState().openAddProject(),
        style: {
          width: '100%', padding: '7px', backgroundColor: 'transparent',
          border: '1px dashed #222', borderRadius: '6px', color: '#555',
          fontSize: '12px', cursor: 'pointer', transition: 'all 150ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          (e.currentTarget).style.borderColor = '#5b6af0';
          (e.currentTarget).style.color = '#5b6af0'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          (e.currentTarget).style.borderColor = '#222';
          (e.currentTarget).style.color = '#555'
        },
      }, '+ Add project')
    ),

    // Footer
    React.createElement('div', {
      style: {
        padding: '8px 12px', borderTop: '1px solid #1a1a1a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      },
    },
      React.createElement('span', { style: { fontSize: '10px', color: '#333' } }, 'agentflow v0.1.1'),
      React.createElement('button', {
        onClick: () => useStore.getState().openSettings(),
        style: {
          background: 'none', border: 'none', color: '#444', cursor: 'pointer',
          fontSize: '14px', padding: '0',
        },
      }, '\u2699'),
    )
  )
}

export default Sidebar
