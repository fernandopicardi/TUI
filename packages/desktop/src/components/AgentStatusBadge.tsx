import * as React from 'react'
import { AgentStatusValue } from '../types'

const STATUS_CONFIG: Record<AgentStatusValue, { color: string; label: string; pulse: boolean }> = {
  working: { color: '#22c55e', label: 'working', pulse: true },
  waiting: { color: '#eab308', label: 'waiting', pulse: false },
  idle: { color: '#444', label: 'idle', pulse: false },
  done: { color: '#5b6af0', label: 'done', pulse: false },
}

const AgentStatusBadge: React.FC<{ status: AgentStatusValue }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '11px',
      color: cfg.color,
    },
  },
    React.createElement('span', {
      style: {
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: cfg.color,
        display: 'inline-block',
        boxShadow: cfg.pulse ? `0 0 6px ${cfg.color}88` : 'none',
        animation: cfg.pulse ? 'pulse 2s infinite' : 'none',
      },
    }),
    cfg.label
  )
}

export default AgentStatusBadge
