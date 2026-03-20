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
      width: '220px', minWidth: '220px', backgroundColor: 'var(--bg-app)',
      borderRight: '1px solid var(--border-subtle)', display: 'flex',
      flexDirection: 'column' as const, height: '100%', overflow: 'hidden',
    },
  },
    // Logo header
    React.createElement('div', {
      style: { padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: '8px' },
    },
      React.createElement('span', {
        style: {
          fontSize: '12px',
          background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        } as React.CSSProperties,
      }, '\u25C6'),
      React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 } }, 'agentflow'),
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
                fontSize: '10px', color: isActiveProject ? 'var(--text-secondary)' : 'var(--text-disabled)',
                textTransform: 'uppercase' as const, letterSpacing: '0.1em', fontWeight: 600,
              },
            }, project.name),
            // Actions (visible on hover)
            React.createElement('div', {
              style: {
                display: 'flex', gap: '4px',
                opacity: hoveredProject === project.id ? 1 : 0,
                transition: 'opacity 100ms',
              },
            },
              React.createElement('button', {
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation()
                  useStore.getState().setActiveProject(project.id)
                  useStore.getState().openCreateAgent()
                },
                style: {
                  background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', padding: '0 2px', transition: 'color 100ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--accent)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-tertiary)' },
                title: 'New agent',
              }, '\u2295'),
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
                  background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', padding: '0 2px', transition: 'color 100ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--error)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-tertiary)' },
                title: 'Remove project',
              }, '\u00D7'),
            )
          ),

          // Agents list
          ...agents.map((agent, i) => {
            const isActive = agent.id === activeAgentId
            const isLast = i === agents.length - 1
            const prefix = isLast ? '\u2514' : '\u251C'
            const isExternal = agent.source === 'external'
            const isWaiting = agent.status === 'waiting'

            return React.createElement('button', {
              key: agent.id,
              onClick: () => useStore.getState().setActiveAgent(agent.id),
              style: {
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', background: isActive ? 'var(--bg-selected)' : 'transparent',
                border: 'none', borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', cursor: 'pointer',
                transition: 'all 100ms', width: '100%', textAlign: 'left' as const,
              },
              onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'
              },
              onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              },
            },
              React.createElement('span', {
                style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', width: '12px', flexShrink: 0 },
              }, prefix),
              isWaiting
                ? React.createElement('span', { style: { color: 'var(--waiting)', fontSize: 'var(--text-xs)', flexShrink: 0 } }, '\u26A0')
                : React.createElement(AgentStatusBadge, { status: agent.status }),
              isExternal
                ? React.createElement('span', {
                    style: { color: 'var(--text-tertiary)', fontSize: '9px', flexShrink: 0 },
                    title: 'Created outside agentflow',
                  }, '\u2B21')
                : null,
              React.createElement('span', {
                style: {
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                  color: isActive ? 'var(--text-primary)' : '#aaa', fontSize: 'var(--text-sm)',
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
          border: '1px dashed #222', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
          fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 150ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = '#222'
          e.currentTarget.style.color = 'var(--text-tertiary)'
        },
      }, '+ Add project')
    ),

    // Footer
    React.createElement('div', {
      style: {
        padding: '8px 12px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      },
    },
      React.createElement('span', { style: { fontSize: '10px', color: 'var(--text-disabled)' } }, 'v0.1.1'),
      React.createElement('button', {
        onClick: () => useStore.getState().openSettings(),
        title: 'Settings (Ctrl+,)',
        style: {
          background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer',
          fontSize: '14px', padding: '0', transition: 'color 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-secondary)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
      }, '\u2699'),
    )
  )
}

export default Sidebar
