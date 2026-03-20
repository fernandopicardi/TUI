import * as React from 'react'
import { AgentStatusValue } from '../types'

const STATUS_CONFIG: Record<AgentStatusValue, { color: string; label: string; pulse: string }> = {
  working: { color: 'var(--working)', label: 'working', pulse: 'pulse 2s infinite' },
  waiting: { color: 'var(--waiting)', label: 'waiting', pulse: 'pulseFast 1s infinite' },
  idle: { color: 'var(--text-disabled)', label: 'idle', pulse: 'none' },
  done: { color: 'var(--done)', label: 'done', pulse: 'none' },
}

const AgentStatusBadge: React.FC<{ status: AgentStatusValue }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  return React.createElement('span', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: 'var(--text-xs)',
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
        boxShadow: status === 'working' || status === 'waiting' ? `0 0 6px ${cfg.color}88` : 'none',
        animation: cfg.pulse,
      },
    }),
    cfg.label
  )
}

export default AgentStatusBadge
