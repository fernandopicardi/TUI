import * as React from 'react'
import { useState } from 'react'
import { useStore } from '../store/index'
import AgentStatusBadge from './AgentStatusBadge'
import TasksPanel from './TasksPanel'
import { getFlags } from '../features'
import { PlusCircle, X, AlertTriangle, Hexagon, ArrowRight, Settings } from 'lucide-react'

type SidebarTab = 'projects' | 'tasks'

const Sidebar: React.FC = () => {
  const projects = useStore(s => s.projects)
  const activeProjectId = useStore(s => s.activeProjectId)
  const activeAgentId = useStore(s => s.activeAgentId)
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SidebarTab>('projects')

  const tabStyle = (tab: SidebarTab): React.CSSProperties => ({
    flex: 1, padding: '6px 0', background: 'none', border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 100ms',
  })

  return React.createElement('aside', {
    style: {
      width: '220px', minWidth: '220px', backgroundColor: 'var(--bg-app)',
      borderRight: '1px solid var(--border-subtle)', display: 'flex',
      flexDirection: 'column' as const, height: '100%', overflow: 'hidden',
    },
  },
    // Tab header
    React.createElement('div', {
      style: { display: 'flex', borderBottom: '1px solid var(--border-subtle)' },
    },
      React.createElement('button', {
        onClick: () => setActiveTab('projects'),
        style: tabStyle('projects'),
      }, 'Projects'),
      React.createElement('button', {
        onClick: () => setActiveTab('tasks'),
        style: tabStyle('tasks'),
      }, 'Tasks'),
    ),

    // Tab content
    activeTab === 'tasks'
      ? React.createElement(TasksPanel)
      : React.createElement(React.Fragment, null,
          // Status summary header
          React.createElement('div', {
            style: { padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
          },
            React.createElement('span', {
              style: { fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600 },
            }, 'Projects'),
            React.createElement('span', {
              style: { fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' },
            }, `${projects.length} project${projects.length !== 1 ? 's' : ''}`),
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
                    padding: '4px 8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                    transition: 'background 100ms',
                  },
                  onClick: () => useStore.getState().setActiveProject(project.id),
                  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
                  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'transparent' },
                },
                  React.createElement('span', {
                    style: {
                      fontSize: '10px', color: isActiveProject ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600,
                    },
                  }, project.name),
                  // Actions (visible on hover)
                  React.createElement('div', {
                    style: {
                      display: 'flex', gap: '4px', alignItems: 'center',
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
                        padding: '0 2px', transition: 'color 100ms', display: 'flex', alignItems: 'center',
                      },
                      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--accent)' },
                      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-tertiary)' },
                      title: 'New agent',
                    }, React.createElement(PlusCircle, { size: 12 })),
                    React.createElement('button', {
                      onClick: (e: React.MouseEvent) => {
                        e.stopPropagation()
                        if (confirm(`Remove project "${project.name}"?`)) {
                          project.agents.forEach(a => {
                            window.runnio?.terminal?.close(a.terminalId)
                          })
                          useStore.getState().removeProject(project.id)
                        }
                      },
                      style: {
                        background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
                        padding: '0 2px', transition: 'color 100ms', display: 'flex', alignItems: 'center',
                      },
                      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--error)' },
                      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-tertiary)' },
                      title: 'Remove project',
                    }, React.createElement(X, { size: 12 })),
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
                      if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                    },
                  },
                    React.createElement('span', {
                      style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', width: '12px', flexShrink: 0 },
                    }, prefix),
                    isWaiting
                      ? React.createElement('span', {
                          style: { color: 'var(--waiting)', flexShrink: 0, display: 'flex', alignItems: 'center' },
                        }, React.createElement(AlertTriangle, { size: 12 }))
                      : React.createElement(AgentStatusBadge, { status: agent.status }),
                    isExternal
                      ? React.createElement('span', {
                          style: { color: 'var(--text-tertiary)', flexShrink: 0, display: 'flex', alignItems: 'center' },
                          title: 'Created outside Runnio',
                        }, React.createElement(Hexagon, { size: 9 }))
                      : null,
                    React.createElement('span', {
                      style: {
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '13px',
                        fontFamily: 'Consolas, monospace',
                      },
                      title: agent.branch,
                    }, agent.branch || 'detached'),
                  )
                })
              )
            })
          ),

          // Plan limit indicator
          (() => {
            const { maxProjects } = getFlags()
            if (maxProjects === Infinity) return null
            const count = projects.length
            return React.createElement('div', {
              style: {
                padding: '4px 16px', fontSize: '11px',
                color: count >= maxProjects ? 'var(--waiting)' : 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              },
            },
              React.createElement('span', null, `${count} / ${maxProjects} projects`),
              count >= maxProjects
                ? React.createElement('span', {
                    style: { fontSize: '11px', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' },
                  }, 'Upgrade ', React.createElement(ArrowRight, { size: 11 }))
                : null
            )
          })(),

          // Add project button
          React.createElement('div', { style: { padding: '8px' } },
            React.createElement('button', {
              onClick: () => useStore.getState().openAddProject(),
              style: {
                width: '100%', padding: '7px', backgroundColor: 'transparent',
                border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 150ms',
              },
              onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              },
              onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              },
            }, '+ Add project')
          ),
        ),

    // Footer
    React.createElement('div', {
      style: {
        padding: '8px 12px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      },
    },
      React.createElement('span', { style: { fontSize: '10px', color: 'var(--text-disabled)' } }, 'v0.1.4'),
      React.createElement('button', {
        onClick: () => useStore.getState().openSettings(),
        title: 'Settings (Ctrl+,)',
        style: {
          background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer',
          padding: '0', transition: 'color 100ms', display: 'flex', alignItems: 'center',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-secondary)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
      }, React.createElement(Settings, { size: 14 })),
    )
  )
}

export default Sidebar
