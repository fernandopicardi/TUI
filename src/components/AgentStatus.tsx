import * as React from 'react'
import { Text } from 'ink'
import { AgentStatus as AgentStatusType } from '../hooks/useAgentStatus.js'

const STATUS_CONFIG: Record<AgentStatusType, { icon: string; color: string; label: string }> = {
  working: { icon: '●', color: 'green', label: 'working' },
  waiting: { icon: '●', color: 'yellow', label: 'waiting' },
  idle: { icon: '○', color: 'gray', label: 'idle' },
  done: { icon: '✓', color: 'cyan', label: 'done' },
}

interface Props {
  status: AgentStatusType
}

const AgentStatusIndicator: React.FC<Props> = ({ status }) => {
  const cfg = STATUS_CONFIG[status]
  return React.createElement(
    Text,
    { color: cfg.color },
    `${cfg.icon} ${cfg.label}`
  )
}

export default AgentStatusIndicator
