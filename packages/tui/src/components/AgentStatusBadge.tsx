import * as React from 'react'
import { Text } from 'ink'
import { AgentStatus } from '@agentflow/core'

const STATUS_CONFIG: Record<AgentStatus, { icon: string; color: string; label: string }> = {
  working: { icon: '\u25CF', color: 'green', label: 'working' },
  waiting: { icon: '\u25CF', color: 'yellow', label: 'waiting' },
  idle: { icon: '\u25CB', color: 'gray', label: 'idle' },
  done: { icon: '\u2713', color: 'cyan', label: 'done' },
}

interface Props {
  status: AgentStatus
}

const AgentStatusBadge: React.FC<Props> = ({ status }) => {
  const cfg = STATUS_CONFIG[status]
  return React.createElement(
    Text,
    { color: cfg.color },
    `${cfg.icon} ${cfg.label}`
  )
}

export default AgentStatusBadge
