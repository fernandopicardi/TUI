import * as React from 'react'
import { useEffect } from 'react'

interface Props {
  message: string
  type?: 'info' | 'success' | 'warning'
  onDismiss: () => void
  index?: number
}

const COLORS = {
  info: { bg: 'var(--bg-selected)', border: 'var(--accent)', icon: '\u25C6' },
  success: { bg: '#0d1a0d', border: 'var(--working)', icon: '\u2713' },
  warning: { bg: '#1a1a0d', border: 'var(--waiting)', icon: '\u26A0' },
}

const Toast: React.FC<Props> = ({ message, type = 'info', onDismiss, index = 0 }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const c = COLORS[type]

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, bottom: `${24 + index * 60}px`, right: '24px',
      background: c.bg, border: `1px solid ${c.border}44`,
      borderLeft: `3px solid ${c.border}`, borderRadius: 'var(--radius-lg)',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
      zIndex: 1000, maxWidth: '320px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      animation: 'slideInRight 0.2s ease-out',
    },
  },
    React.createElement('span', { style: { color: c.border, fontSize: '14px' } }, c.icon),
    React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-base)', flex: 1 } }, message),
    React.createElement('button', {
      onClick: onDismiss,
      style: {
        marginLeft: 'auto', background: 'none', border: 'none',
        color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', lineHeight: '1',
        transition: 'color 100ms',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-primary)' },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-secondary)' },
    }, '\u00D7')
  )
}

export default Toast
