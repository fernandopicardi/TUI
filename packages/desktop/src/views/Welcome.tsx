import * as React from 'react'
import { useStore } from '../hooks/useStore'
import { ArrowRight } from 'lucide-react'

const Welcome: React.FC = () => {
  const projects = useStore(s => s.projects)

  const handleReopen = (projectId: string) => {
    useStore.getState().setActiveProject(projectId)
  }

  const getAgentSummary = (p: typeof projects[0]) => {
    const count = p.agents.length
    const active = p.agents.filter(a => a.status === 'working').length
    const waiting = p.agents.filter(a => a.status === 'waiting').length
    const parts: string[] = []
    parts.push(`${count} agent${count !== 1 ? 's' : ''}`)
    if (active > 0) parts.push(`${active} active`)
    else if (waiting > 0) parts.push(`${waiting} waiting`)
    else parts.push('idle')
    return parts.join(' \u00B7 ')
  }

  return React.createElement('div', {
    style: {
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: '32px',
      animation: 'fadeIn 0.2s ease-out',
    },
  },
    // Logo + title
    React.createElement('div', { style: { textAlign: 'center' as const } },
      React.createElement('div', {
        style: {
          fontSize: '32px', margin: '0 auto 16px',
          background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        } as React.CSSProperties,
      }, '\u25C6'),
      React.createElement('h1', {
        style: { fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' },
      }, 'Runnio'),
      React.createElement('p', {
        style: { fontSize: '15px', color: 'var(--text-secondary)', margin: 0, maxWidth: '360px', lineHeight: '1.5' },
      }, 'Orchestrate multiple Claude Code agents across projects. Parallel. Persistent.')
    ),

    // Action buttons
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '8px', alignItems: 'center' },
    },
      React.createElement('button', {
        onClick: () => useStore.getState().openAddProject(),
        style: {
          padding: '10px 28px', backgroundColor: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-md)', fontWeight: 500,
          cursor: 'pointer', transition: 'opacity 150ms, transform 80ms', width: '280px',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
        onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'scale(0.98)' },
        onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'scale(1)' },
      }, '+ Add project'),
    ),

    // Recent projects
    projects.length > 0
      ? React.createElement('div', { style: { width: '100%', maxWidth: '360px' } },
          React.createElement('div', {
            style: { width: '100%', height: '1px', background: 'var(--border-default)', marginBottom: '20px' },
          }),
          React.createElement('div', {
            style: {
              color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px',
            },
          }, 'Recent'),
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
          },
            ...projects.slice(0, 5).map(p => {
              const agentCount = p.agents.length
              const activeCount = p.agents.filter(a => a.status === 'working').length

              return React.createElement('button', {
                key: p.id,
                onClick: () => handleReopen(p.id),
                style: {
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'transparent', border: 'none',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'background 100ms', width: '100%',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' },
              },
                React.createElement('div', null,
                  React.createElement('div', {
                    style: { color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontFamily: 'Consolas, monospace' },
                  }, p.name),
                  React.createElement('div', {
                    style: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' },
                  },
                    React.createElement('span', {
                      style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' },
                    }, getAgentSummary(p)),
                    activeCount > 0
                      ? React.createElement('span', {
                          style: {
                            width: '5px', height: '5px', borderRadius: '50%',
                            backgroundColor: 'var(--working)', animation: 'pulse 2s infinite',
                          },
                        })
                      : null,
                  ),
                ),
                React.createElement('span', { style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '2px' } }, 'open ', React.createElement(ArrowRight, { size: 12 }))
              )
            })
          )
        )
      // Empty state — no projects yet
      : React.createElement('div', {
          style: { textAlign: 'center' as const, maxWidth: '320px' },
        },
          React.createElement('div', {
            style: { width: '100%', height: '1px', background: 'var(--border-default)', marginBottom: '20px' },
          }),
          React.createElement('p', {
            style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', lineHeight: '1.6', margin: 0 },
          }, 'Add a Git project to start orchestrating agents. Each agent runs in its own worktree with a persistent Claude Code terminal.'),
        )
  )
}

export default Welcome
