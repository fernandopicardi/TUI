import * as React from 'react'
import { Text, Box } from 'ink'
import { PluginContext } from '../types.js'

interface ClientInfo {
  name: string
  slug: string
  hasActiveTests: boolean
  hasWinners: boolean
  hypothesisCount: number
}

const AgencyOSPanel: React.FC<{ context: PluginContext }> = ({ context }) => {
  const clients = (context.data.clients || []) as ClientInfo[]

  if (clients.length === 0) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true }, '◆ Agency OS'),
      React.createElement(Text, { dimColor: true }, '  Nenhum cliente encontrado ainda')
    )
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(
      Text,
      { bold: true },
      `◆ Agency OS — ${clients.length} cliente(s) ativo(s)`
    ),
    React.createElement(
      Box,
      { flexDirection: 'column', marginLeft: 1 },
      ...clients.map((client, i) => {
        const isLast = i === clients.length - 1
        const prefix = isLast ? '└' : '├'

        let statusIcon: string
        let statusText: string
        let statusColor: string

        if (client.hasWinners) {
          statusIcon = '✓'
          statusText = 'winner pronto'
          statusColor = 'cyan'
        } else if (client.hasActiveTests) {
          statusIcon = '●'
          statusText = 'loop ativo'
          statusColor = 'green'
        } else {
          statusIcon = '○'
          statusText = 'aguardando'
          statusColor = 'yellow'
        }

        const extra = client.hypothesisCount > 0
          ? `  ${client.hypothesisCount} hipótese(s) pendente(s)`
          : ''

        return React.createElement(
          Text,
          { key: client.slug },
          `${prefix} ${client.slug.padEnd(18)}`,
          React.createElement(Text, { color: statusColor }, `${statusIcon} ${statusText}`),
          extra
        )
      })
    )
  )
}

export default AgencyOSPanel
