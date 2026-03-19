import * as React from 'react'
import { useStore } from '../hooks/useStore'
import { store } from '../store/index'

interface Props {
  onOpenProject: () => void
}

const Welcome: React.FC<Props> = ({ onOpenProject }) => {
  const recents = useStore(s => s.recentProjects)

  const handleRecent = async (path: string) => {
    try {
      const config = await window.agentflow.config.load(path)
      store.getState().setConfig(config)
      store.getState().setRootPath(path)
      store.getState().addRecentProject(path)
    } catch {
      store.getState().setError('N\u00E3o foi poss\u00EDvel abrir o projeto')
    }
  }

  const formatPath = (p: string) => {
    const parts = p.split(/[\\/]/)
    return parts.length > 2 ? `.../${parts.slice(-2).join('/')}` : p
  }

  return React.createElement('div', {
    style: {
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: '32px',
    },
  },
    // Logo + title
    React.createElement('div', {
      style: { textAlign: 'center' as const },
    },
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
        style: { fontSize: '14px', color: '#666', margin: 0, maxWidth: '320px', lineHeight: '1.5' },
      }, 'Orquestre m\u00FAltiplos agentes Claude Code em projetos paralelos, com contexto persistente.')
    ),

    // Open button
    React.createElement('button', {
      onClick: onOpenProject,
      style: {
        padding: '10px 28px', backgroundColor: '#5b6af0', color: '#fff',
        border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
        cursor: 'pointer', transition: 'opacity 150ms',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.opacity = '0.85' },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.opacity = '1' },
    }, 'Abrir projeto'),

    // Recents
    recents.length > 0
      ? React.createElement('div', {
          style: { width: '100%', maxWidth: '360px' },
        },
          React.createElement('div', {
            style: {
              width: '100%', height: '1px', background: '#1f1f1f', marginBottom: '20px',
            },
          }),
          React.createElement('div', {
            style: { color: '#555', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' },
          }, 'Recentes'),
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
          },
            ...recents.map((p) =>
              React.createElement('button', {
                key: p,
                onClick: () => handleRecent(p),
                style: {
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'transparent', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'background 0.1s', width: '100%',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.background = '#111' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.background = 'transparent' },
              },
                React.createElement('span', {
                  style: { color: '#ededed', fontSize: '13px', fontFamily: 'Consolas, monospace' },
                }, formatPath(p)),
                React.createElement('span', { style: { color: '#333', fontSize: '12px' } }, '\u2192')
              )
            )
          )
        )
      : null
  )
}

export default Welcome
