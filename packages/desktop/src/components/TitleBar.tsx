import * as React from 'react'
import { useStore } from '../store/index'

declare const __RUNNIO_DEV__: string

const TitleBar: React.FC<{ projectName?: string }> = ({ projectName }) => {
  return React.createElement('div', {
    style: {
      height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-app)',
      WebkitAppRegion: 'drag', flexShrink: 0, userSelect: 'none',
    } as React.CSSProperties,
  },
    // Left — logo + name (clickable to go home)
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '10px' },
    },
      React.createElement('button', {
        onClick: () => useStore.getState().setActiveAgent(null),
        title: 'Back to Dashboard',
        style: {
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px 4px', borderRadius: 'var(--radius-sm)',
          transition: 'opacity 120ms',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties,
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.75' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
      },
        React.createElement('span', {
          style: {
            fontSize: '16px',
            background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          } as React.CSSProperties,
        }, '\u25C6'),
        React.createElement('span', {
          style: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 },
        }, 'Runnio'),
      ),
      projectName
        ? React.createElement(React.Fragment, null,
            React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: '12px' } }, '/'),
            React.createElement('span', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, projectName)
          )
        : null,
      (typeof __RUNNIO_DEV__ !== 'undefined' && __RUNNIO_DEV__ === 'true')
        ? React.createElement('div', {
            style: {
              padding: '2px 8px',
              background: '#fbbf2420',
              border: '1px solid #fbbf2440',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#fbbf24',
              letterSpacing: '0.05em',
            },
          }, 'DEV')
        : null,
    ),

    // Right — action icons + window controls
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '4px', WebkitAppRegion: 'no-drag' } as React.CSSProperties,
    },
      // Quick Prompt icon
      React.createElement('button', {
        onClick: () => useStore.getState().openQuickPrompt(),
        title: 'Quick Prompt (Ctrl+Space)',
        style: {
          width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-tertiary)', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.color = 'var(--text-primary)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-tertiary)'
        },
      }, '\u26A1'),
      // Command Palette icon
      React.createElement('button', {
        onClick: () => useStore.getState().openCommandPalette(),
        title: 'Command Palette (Ctrl+K)',
        style: {
          width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-tertiary)', fontSize: '13px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.color = 'var(--text-primary)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-tertiary)'
        },
      }, '\u2318'),

      React.createElement('div', { style: { width: '8px' } }),

      // Window controls
      ...[
        { action: 'minimize', color: '#fbbf24' },
        { action: 'maximize', color: '#4ade80' },
        { action: 'close', color: '#f87171' },
      ].map((btn) =>
        React.createElement('button', {
          key: btn.action,
          onClick: () => (window.runnio?.window as any)?.[btn.action]?.(),
          style: {
            width: '13px', height: '13px', borderRadius: '50%',
            background: `${btn.color}33`, border: `1px solid ${btn.color}66`,
            cursor: 'pointer', padding: 0, transition: 'background 150ms',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = btn.color },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = `${btn.color}33` },
        })
      )
    )
  )
}

export default TitleBar
