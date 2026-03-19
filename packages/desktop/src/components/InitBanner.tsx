import * as React from 'react'

interface Props {
  onSelect: (template: string) => void
}

const pillBase: React.CSSProperties = {
  background: '#111', border: '1px solid #1f1f1f', borderRadius: '20px',
  padding: '6px 16px', color: '#888', fontSize: '12px', cursor: 'pointer',
  transition: 'all 0.15s',
}

const InitBanner: React.FC<Props> = ({ onSelect }) => {
  return React.createElement('div', {
    style: {
      background: '#0d0d1a', border: '1px solid #5b6af033',
      borderLeft: '3px solid #5b6af0', borderRadius: '8px',
      padding: '20px 24px', margin: '16px',
    },
  },
    React.createElement('div', {
      style: { marginBottom: '12px' },
    },
      React.createElement('div', {
        style: { color: '#ededed', fontSize: '14px', fontWeight: 500, marginBottom: '6px' },
      }, '\u25C6 Este projeto ainda n\u00E3o tem estrutura agentflow'),
      React.createElement('div', {
        style: { color: '#666', fontSize: '13px', lineHeight: '1.5' },
      }, 'Configure com Claude Code para ativar plugins, contexto de agentes e workflows autom\u00E1ticos.')
    ),
    React.createElement('div', {
      style: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
    },
      // Primary
      React.createElement('button', {
        onClick: () => onSelect('auto'),
        style: {
          ...pillBase, background: '#5b6af0', color: '#fff', border: '1px solid #5b6af0',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' },
      }, 'Deixar Claude Code decidir'),
      // Secondary pills
      ...(['agencyOS', 'bmad', 'generic'] as const).map((t) =>
        React.createElement('button', {
          key: t,
          onClick: () => onSelect(t),
          style: { ...pillBase },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#5b6af0';
            (e.currentTarget as HTMLButtonElement).style.color = '#ededed'
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f1f1f';
            (e.currentTarget as HTMLButtonElement).style.color = '#888'
          },
        }, t === 'agencyOS' ? 'Agency OS' : t === 'bmad' ? 'BMAD' : 'Generic')
      )
    )
  )
}

export default InitBanner
