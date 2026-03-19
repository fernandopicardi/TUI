import * as React from 'react'
import { useStore } from '../hooks/useStore'

const Welcome: React.FC = () => {
  const projects = useStore(s => s.projects)

  const handleReopen = (projectId: string) => {
    useStore.getState().setActiveProject(projectId)
  }

  return React.createElement('div', {
    style: {
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: '32px',
    },
  },
    // Logo + title
    React.createElement('div', { style: { textAlign: 'center' as const } },
      React.createElement('div', {
        style: {
          width: '48px', height: '48px', margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #5b6af0, #7c3aed)',
          borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', color: '#fff',
        },
      }, '\u25C6'),
      React.createElement('h1', {
        style: { fontSize: '22px', fontWeight: 600, color: '#ededed', margin: '0 0 8px' },
      }, 'agentflow'),
      React.createElement('p', {
        style: { fontSize: '14px', color: '#666', margin: 0, maxWidth: '360px', lineHeight: '1.5' },
      }, 'Orchestrate multiple Claude Code agents across multiple projects, simultaneously.')
    ),

    // Action buttons
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '8px', alignItems: 'center' },
    },
      React.createElement('button', {
        onClick: () => useStore.getState().openAddProject(),
        style: {
          padding: '10px 28px', backgroundColor: '#5b6af0', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
          cursor: 'pointer', transition: 'opacity 150ms', width: '260px',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.opacity = '1' },
      }, '+ Add first project'),
    ),

    // Recent projects (from persisted store)
    projects.length > 0
      ? React.createElement('div', { style: { width: '100%', maxWidth: '360px' } },
          React.createElement('div', {
            style: { width: '100%', height: '1px', background: '#1f1f1f', marginBottom: '20px' },
          }),
          React.createElement('div', {
            style: {
              color: '#555', fontSize: '11px', fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px',
            },
          }, 'Recent projects'),
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
          },
            ...projects.slice(0, 5).map(p =>
              React.createElement('button', {
                key: p.id,
                onClick: () => handleReopen(p.id),
                style: {
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'transparent', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'background 0.1s', width: '100%',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.background = '#111' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.background = 'transparent' },
              },
                React.createElement('div', null,
                  React.createElement('div', {
                    style: { color: '#ededed', fontSize: '13px', fontFamily: 'Consolas, monospace' },
                  }, p.name),
                  React.createElement('div', {
                    style: { color: '#444', fontSize: '11px', marginTop: '2px' },
                  }, p.rootPath),
                ),
                React.createElement('span', { style: { color: '#555', fontSize: '12px' } }, 'open \u2192')
              )
            )
          )
        )
      : null
  )
}

export default Welcome
