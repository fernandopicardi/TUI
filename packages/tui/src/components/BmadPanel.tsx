import * as React from 'react'
import { Text, Box } from 'ink'
import { PluginContext, BmadData } from '@runnio/core'

const BmadPanel: React.FC<{ context: PluginContext }> = ({ context }) => {
  const data = context.data as unknown as BmadData

  if (data.agents.length === 0 && !data.phase) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true }, '\u25C6 BMAD detectado'),
      React.createElement(Text, { dimColor: true }, '  Nenhum workflow ativo')
    )
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(
      Text,
      { bold: true },
      `\u25C6 BMAD \u2014 ${data.agents.length} agente(s)`
    ),
    data.phase
      ? React.createElement(Text, { dimColor: true }, `  Fase: ${data.phase}`)
      : null,
    data.agents.length > 0
      ? React.createElement(
          Box,
          { flexDirection: 'column', marginLeft: 1 },
          ...data.agents.map((agent: string, i: number) => {
            const isLast = i === data.agents.length - 1
            return React.createElement(Text, { key: agent }, `${isLast ? '\u2514' : '\u251C'} ${agent}`)
          })
        )
      : null
  )
}

export default BmadPanel
