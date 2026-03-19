import * as React from 'react'

const TitleBar: React.FC<{ projectName?: string }> = ({ projectName }) => {
  return React.createElement('div', {
    className: 'titlebar',
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '36px',
      backgroundColor: '#0a0a0a',
      borderBottom: '1px solid #1f1f1f',
      WebkitAppRegion: 'drag',
      padding: '0 12px',
      userSelect: 'none',
    } as React.CSSProperties,
  },
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '8px' },
    },
      React.createElement('span', {
        style: { color: '#5b6af0', fontSize: '14px', fontWeight: 700 },
      }, '\u2B21'),
      React.createElement('span', {
        style: { color: '#ededed', fontSize: '13px', fontWeight: 600 },
      }, 'agentflow'),
      projectName
        ? React.createElement('span', {
            style: { color: '#888', fontSize: '12px', marginLeft: '8px' },
          }, `\u2014 ${projectName}`)
        : null
    ),
    React.createElement('div', {
      style: { display: 'flex', gap: '4px', WebkitAppRegion: 'no-drag' } as React.CSSProperties,
    },
      React.createElement('button', {
        onClick: () => window.agentflow.window.minimize(),
        className: 'window-btn',
        title: 'Minimize',
      }, '\u2212'),
      React.createElement('button', {
        onClick: () => window.agentflow.window.maximize(),
        className: 'window-btn',
        title: 'Maximize',
      }, '\u25A1'),
      React.createElement('button', {
        onClick: () => window.agentflow.window.close(),
        className: 'window-btn window-btn-close',
        title: 'Close',
      }, '\u00D7')
    )
  )
}

export default TitleBar
