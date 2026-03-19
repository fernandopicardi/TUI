import * as React from 'react'

const TitleBar: React.FC<{ projectName?: string }> = ({ projectName }) => {
  return React.createElement('div', {
    style: {
      height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', borderBottom: '1px solid #1a1a1a', background: '#080808',
      WebkitAppRegion: 'drag', flexShrink: 0, userSelect: 'none',
    } as React.CSSProperties,
  },
    // Left — logo + name
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '10px' },
    },
      React.createElement('div', {
        style: {
          width: '18px', height: '18px',
          background: 'linear-gradient(135deg, #5b6af0, #7c3aed)',
          borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', color: '#fff', fontWeight: 700,
        },
      }, 'A'),
      React.createElement('span', {
        style: { fontSize: '13px', color: '#ededed', fontWeight: 500 },
      }, 'agentflow'),
      projectName
        ? React.createElement(React.Fragment, null,
            React.createElement('span', { style: { color: '#333', fontSize: '12px' } }, '/'),
            React.createElement('span', { style: { fontSize: '12px', color: '#666' } }, projectName)
          )
        : null
    ),

    // Right — window controls (macOS-style dots)
    React.createElement('div', {
      style: { display: 'flex', gap: '6px', WebkitAppRegion: 'no-drag' } as React.CSSProperties,
    },
      ...[
        { action: 'minimize', color: '#eab308' },
        { action: 'maximize', color: '#22c55e' },
        { action: 'close', color: '#ef4444' },
      ].map((btn) =>
        React.createElement('button', {
          key: btn.action,
          onClick: () => (window.agentflow?.window as any)?.[btn.action]?.(),
          style: {
            width: '13px', height: '13px', borderRadius: '50%',
            background: `${btn.color}33`, border: `1px solid ${btn.color}66`,
            cursor: 'pointer', padding: 0, transition: 'background 0.15s',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.background = btn.color },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.background = `${btn.color}33` },
        })
      )
    )
  )
}

export default TitleBar
