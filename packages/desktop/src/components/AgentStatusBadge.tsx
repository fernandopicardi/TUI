import * as React from 'react'
import { AgentStatusValue } from '../types'

const STATUS_CONFIG: Record<AgentStatusValue, { color: string; label: string }> = {
  working: { color: '#22c55e', label: 'working' },
  waiting: { color: '#eab308', label: 'waiting' },
  idle: { color: '#555', label: 'idle' },
  done: { color: '#5b6af0', label: 'done' },
}

const AgentStatusBadge: React.FC<{ status: AgentStatusValue }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      color: cfg.color,
    },
  },
    React.createElement('span', {
      style: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: cfg.color,
        display: 'inline-block',
      },
    }),
    cfg.label
  )
}

export default AgentStatusBadge
