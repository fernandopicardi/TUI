import * as React from 'react'
import { useEffect } from 'react'

interface Props {
  message: string
  type?: 'info' | 'success' | 'warning'
  onDismiss: () => void
}

const COLORS = {
  info: { bg: '#0d0d1a', border: '#5b6af0', icon: '\u25C6' },
  success: { bg: '#0d1a0d', border: '#22c55e', icon: '\u2713' },
  warning: { bg: '#1a1a0d', border: '#eab308', icon: '\u26A0' },
}

const Toast: React.FC<Props> = ({ message, type = 'info', onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const c = COLORS[type]

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, bottom: '24px', right: '24px',
      background: c.bg, border: `1px solid ${c.border}44`,
      borderLeft: `3px solid ${c.border}`, borderRadius: '8px',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
      zIndex: 1000, maxWidth: '320px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      animation: 'fadeIn 0.2s ease-out',
    },
  },
    React.createElement('span', { style: { color: c.border, fontSize: '14px' } }, c.icon),
    React.createElement('span', { style: { color: '#ededed', fontSize: '13px', flex: 1 } }, message),
    React.createElement('button', {
      onClick: onDismiss,
      style: { marginLeft: 'auto', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px', lineHeight: '1' },
    }, '\u00D7')
  )
}

export default Toast
