import * as React from 'react'
import { useEffect } from 'react'
import { Diamond, Check, AlertTriangle, X } from 'lucide-react'

interface Props {
  message: string
  type?: 'info' | 'success' | 'warning'
  onDismiss: () => void
  index?: number
}

const COLORS = {
  info: { bg: 'var(--bg-selected)', border: 'var(--accent)', Icon: Diamond },
  success: { bg: '#0d1a0d', border: 'var(--working)', Icon: Check },
  warning: { bg: '#1a1a0d', border: 'var(--waiting)', Icon: AlertTriangle },
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
    React.createElement('span', {
      style: { color: c.border, display: 'flex', alignItems: 'center' },
    }, React.createElement(c.Icon, { size: 14 })),
    React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-base)', flex: 1 } }, message),
    React.createElement('button', {
      onClick: onDismiss,
      style: {
        marginLeft: 'auto', background: 'none', border: 'none',
        color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: '1',
        transition: 'color 100ms', display: 'flex', alignItems: 'center',
        padding: '2px',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-primary)' },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-secondary)' },
    }, React.createElement(X, { size: 14 }))
  )
}

export default Toast
