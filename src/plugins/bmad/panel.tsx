import * as React from 'react'
import { Text, Box } from 'ink'
import { PluginContext } from '../types.js'

const BMADPanel: React.FC<{ context: PluginContext }> = ({ context }) => {
  const data = context.data as { agents: string[]; phase?: string }

  if (data.agents.length === 0 && !data.phase) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true }, '◆ BMAD detectado'),
      React.createElement(Text, { dimColor: true }, '  Nenhum workflow ativo')
    )
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(
      Text,
      { bold: true },
      `◆ BMAD — ${data.agents.length} agente(s) detectado(s)`
    ),
    data.phase
      ? React.createElement(Text, { dimColor: true }, `  Fase: ${data.phase}`)
      : null,
    data.agents.length > 0
      ? React.createElement(
          Box,
          { flexDirection: 'column', marginLeft: 1 },
          ...data.agents.map((agent, i) => {
            const isLast = i === data.agents.length - 1
            return React.createElement(Text, { key: agent }, `${isLast ? '└' : '├'} ${agent}`)
          })
        )
      : null
  )
}

export default BMADPanel
