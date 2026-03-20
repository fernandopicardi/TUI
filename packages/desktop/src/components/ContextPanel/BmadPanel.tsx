import * as React from 'react'
import { PluginContextData } from '../../types'

const BmadPanel: React.FC<{ context: PluginContextData }> = ({ context }) => {
  const agents = (context.data.agents || []) as string[]
  const phase = context.data.phase as string | undefined

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  },
    React.createElement('div', {
      style: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
    }, `BMAD \u2014 ${agents.length} agente(s)`),
    phase
      ? React.createElement('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, `Fase: ${phase}`)
      : null,
    agents.length > 0
      ? React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
        },
          ...agents.map((agent: string) =>
            React.createElement('div', {
              key: agent,
              style: { fontSize: '12px', color: 'var(--text-primary)', paddingLeft: '8px' },
            }, `\u2022 ${agent}`)
          )
        )
      : null
  )
}

export default BmadPanel
