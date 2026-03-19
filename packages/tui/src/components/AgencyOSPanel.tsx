import * as React from 'react'
import { Text, Box } from 'ink'
import { PluginContext, AgencyClient } from '@agentflow/core'

const AgencyOSPanel: React.FC<{ context: PluginContext }> = ({ context }) => {
  const clients = (context.data.clients || []) as AgencyClient[]

  if (clients.length === 0) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true }, '\u25C6 Agency OS'),
      React.createElement(Text, { dimColor: true }, '  Nenhum cliente encontrado ainda')
    )
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, `\u25C6 Agency OS \u2014 ${clients.length} cliente(s)`),
    React.createElement(
      Box,
      { flexDirection: 'column', marginLeft: 1 },
      ...clients.map((client, i) => {
        const isLast = i === clients.length - 1
        const prefix = isLast ? '\u2514' : '\u251C'

        let statusIcon: string
        let statusText: string
        let statusColor: string

        if (client.hasWinner) {
          statusIcon = '\u2713'
          statusText = 'winner pronto'
          statusColor = 'cyan'
        } else if (client.loopStatus === 'active') {
          statusIcon = '\u25CF'
          statusText = 'loop ativo'
          statusColor = 'green'
        } else {
          statusIcon = '\u25CB'
          statusText = 'aguardando'
          statusColor = 'yellow'
        }

        const extra = client.hypothesisCount > 0
          ? `  ${client.hypothesisCount} hip\u00F3tese(s)`
          : ''

        return React.createElement(
          Text,
          { key: client.id },
          `${prefix} ${client.id.padEnd(18)}`,
          React.createElement(Text, { color: statusColor }, `${statusIcon} ${statusText}`),
          extra
        )
      })
    )
  )
}

export default AgencyOSPanel
