import * as React from 'react'
import { PluginContextData } from '../../types'

interface ClientInfo {
  id: string
  name: string
  loopStatus: string
  hypothesisCount: number
  hasWinner: boolean
}

const STATUS_COLORS: Record<string, string> = {
  'active': 'var(--working)',
  'waiting': 'var(--waiting)',
  'winner-ready': 'var(--accent)',
  'inactive': 'var(--text-tertiary)',
}

const AgencyOSPanel: React.FC<{ context: PluginContextData }> = ({ context }) => {
  const clients = (context.data.clients || []) as ClientInfo[]

  if (clients.length === 0) {
    return React.createElement('div', { style: { color: 'var(--text-secondary)', fontSize: '12px' } },
      'Nenhum cliente encontrado ainda'
    )
  }

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  },
    React.createElement('div', {
      style: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
    }, `Agency OS \u2014 ${clients.length} clientes`),
    ...clients.map((client) =>
      React.createElement('div', {
        key: client.id,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          padding: '4px 0',
        },
      },
        React.createElement('span', {
          style: {
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: STATUS_COLORS[client.loopStatus] || 'var(--text-tertiary)',
            display: 'inline-block',
          },
        }),
        React.createElement('span', { style: { color: 'var(--text-primary)', flex: 1 } }, client.name),
        client.hypothesisCount > 0
          ? React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: '11px' } },
              `${client.hypothesisCount} hip.`)
          : null,
        client.hasWinner
          ? React.createElement('span', { style: { color: 'var(--accent)', fontSize: '11px' } }, '\u2713 winner')
          : null
      )
    )
  )
}

export default AgencyOSPanel
