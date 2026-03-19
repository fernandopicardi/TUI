import * as React from 'react'

interface Props {
  onOpenProject: () => void
}

const Welcome: React.FC<Props> = ({ onOpenProject }) => {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '24px',
      color: '#ededed',
    },
  },
    React.createElement('div', {
      style: { fontSize: '48px', color: '#5b6af0' },
    }, '\u2B21'),
    React.createElement('h1', {
      style: { fontSize: '24px', fontWeight: 600, margin: 0 },
    }, 'agentflow'),
    React.createElement('p', {
      style: { fontSize: '14px', color: '#888', margin: 0, textAlign: 'center' as const },
    }, 'Orquestre m\u00FAltiplos agentes Claude Code em paralelo'),
    React.createElement('button', {
      onClick: onOpenProject,
      style: {
        padding: '10px 24px',
        backgroundColor: '#5b6af0',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'opacity 150ms ease',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'
      },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '1'
      },
    }, 'Abrir projeto'),
    React.createElement('p', {
      style: { fontSize: '12px', color: '#555', margin: 0 },
    }, 'Selecione uma pasta que contenha um reposit\u00F3rio git')
  )
}

export default Welcome
