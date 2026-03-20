import * as React from 'react'

interface Props {
  onSelect: (template: string) => void
}

const pillBase: React.CSSProperties = {
  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '20px',
  padding: '6px 16px', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer',
  transition: 'all 150ms',
}

const InitBanner: React.FC<Props> = ({ onSelect }) => {
  return React.createElement('div', {
    style: {
      background: 'var(--bg-selected)', border: '1px solid #6366f133',
      borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius-lg)',
      padding: '20px 24px', margin: '16px',
    },
  },
    React.createElement('div', {
      style: { marginBottom: '12px' },
    },
      React.createElement('div', {
        style: { color: 'var(--text-primary)', fontSize: 'var(--text-md)', fontWeight: 500, marginBottom: '6px' },
      }, '\u25C6 This project has no Runnio structure yet'),
      React.createElement('div', {
        style: { color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: '1.5' },
      }, 'Pick a template below to start a Claude Code session that will analyze the project and set up the right structure automatically.')
    ),
    React.createElement('div', {
      style: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
    },
      // Primary
      React.createElement('button', {
        onClick: () => onSelect('auto'),
        style: {
          ...pillBase, background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
      }, 'Let Claude Code decide'),
      // Secondary pills
      ...(['agencyOS', 'bmad', 'generic'] as const).map((t) =>
        React.createElement('button', {
          key: t,
          onClick: () => onSelect(t),
          style: { ...pillBase },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--text-primary)'
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          },
        }, t === 'agencyOS' ? 'Agency OS' : t === 'bmad' ? 'BMAD' : 'Generic')
      )
    )
  )
}

export default InitBanner
