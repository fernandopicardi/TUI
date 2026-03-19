import * as React from 'react'
import { useState } from 'react'

interface Props {
  worktreePath: string
}

const MCPPanel: React.FC<Props> = ({ worktreePath }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return React.createElement('div', {
    style: {
      borderTop: '1px solid #1f1f1f',
      background: '#080808',
      flexShrink: 0,
    },
  },
    // Collapsible header
    React.createElement('button', {
      onClick: () => setIsExpanded(v => !v),
      style: {
        width: '100%', padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#888', fontSize: '12px',
      },
    },
      React.createElement('span', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' },
      },
        React.createElement('span', { style: { color: '#5b6af0' } }, '\u25C6'),
        'MCP Servers'
      ),
      React.createElement('span', { style: { fontSize: '10px' } }, isExpanded ? '\u25BC' : '\u25B6')
    ),

    isExpanded
      ? React.createElement('div', {
          style: { padding: '0 16px 12px' },
        },
          React.createElement('p', {
            style: { color: '#555', fontSize: '12px', margin: 0, lineHeight: '1.6' },
          },
            'Nenhum MCP configurado neste projeto. ',
            'Configure em ',
            React.createElement('code', { style: { color: '#5b6af0' } }, '.claude/settings.json'),
            ' para ver servidores MCP aqui.'
          )
        )
      : null
  )
}

export default MCPPanel
