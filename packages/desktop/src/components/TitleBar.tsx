import * as React from 'react'
import { useStore } from '../store/index'
import { Zap, Command, FolderOpen, Globe, Menu, Settings, ArrowLeft, ArrowRight, Minus, Square, X } from 'lucide-react'

declare const __RUNNIO_DEV__: string

interface ToolbarIconProps {
  label: string
  shortcut: string
  icon: React.ReactElement
  isActive?: boolean
  onClick: () => void
}

const ToolbarIcon: React.FC<ToolbarIconProps> = ({ label, shortcut, icon, isActive, onClick }) => {
  return React.createElement('button', {
    onClick,
    title: `${label} (${shortcut})`,
    style: {
      width: '28px', height: '28px', borderRadius: '6px',
      background: isActive ? 'var(--bg-elevated)' : 'transparent',
      border: 'none', cursor: 'pointer',
      color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'color 100ms, background 100ms',
      padding: '6px',
    } as React.CSSProperties,
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isActive) {
        e.currentTarget.style.background = 'var(--bg-elevated)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isActive) {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-tertiary)'
      }
    },
  }, icon)
}

const TitleBar: React.FC<{ projectName?: string }> = ({ projectName }) => {
  const canBack = useStore(s => s.canNavigateBack())
  const canForward = useStore(s => s.canNavigateForward())
  const isRightPanelOpen = useStore(s => s.isRightPanelOpen)
  const rightPanelTab = useStore(s => s.rightPanelTab)
  const isBrowserPreviewOpen = useStore(s => s.isBrowserPreviewOpen)

  return React.createElement('div', {
    style: {
      height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-app)',
      WebkitAppRegion: 'drag', flexShrink: 0, userSelect: 'none',
    } as React.CSSProperties,
  },
    // Left — logo + project name + nav arrows
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' } as React.CSSProperties,
    },
      // Logo — click to go home
      React.createElement('button', {
        onClick: () => {
          const s = useStore.getState()
          s.setActiveAgent(null)
          s.navigateTo('home')
        },
        title: 'Home (Ctrl+H)',
        style: {
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
          borderRadius: '6px', transition: 'background 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' },
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

      // Project name breadcrumb
      projectName
        ? React.createElement(React.Fragment, null,
            React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: '12px' } }, '/'),
            React.createElement('span', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, projectName),
          )
        : null,

      // DEV badge
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

      // Spacer
      React.createElement('div', { style: { width: '8px' } }),

      // Back/forward nav arrows
      React.createElement('button', {
        onClick: () => useStore.getState().navigateBack(),
        disabled: !canBack,
        title: 'Back',
        style: {
          width: '24px', height: '24px', borderRadius: '4px',
          background: 'transparent', border: 'none', cursor: canBack ? 'pointer' : 'default',
          color: canBack ? 'var(--text-secondary)' : 'var(--text-disabled)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 100ms', opacity: canBack ? 1 : 0.4,
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          if (canBack) e.currentTarget.style.background = 'var(--bg-elevated)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.background = 'transparent'
        },
      }, React.createElement(ArrowLeft, { size: 14 })),
      React.createElement('button', {
        onClick: () => useStore.getState().navigateForward(),
        disabled: !canForward,
        title: 'Forward',
        style: {
          width: '24px', height: '24px', borderRadius: '4px',
          background: 'transparent', border: 'none', cursor: canForward ? 'pointer' : 'default',
          color: canForward ? 'var(--text-secondary)' : 'var(--text-disabled)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 100ms', opacity: canForward ? 1 : 0.4,
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          if (canForward) e.currentTarget.style.background = 'var(--bg-elevated)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.background = 'transparent'
        },
      }, React.createElement(ArrowRight, { size: 14 })),
    ),

    // Right — toolbar icons + window controls
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '2px', WebkitAppRegion: 'no-drag' } as React.CSSProperties,
    },
      // Quick Prompt
      React.createElement(ToolbarIcon, {
        label: 'Quick Prompt', shortcut: 'Ctrl+Space',
        icon: React.createElement(Zap, { size: 16 }),
        onClick: () => useStore.getState().openQuickPrompt(),
      }),
      // Command Palette
      React.createElement(ToolbarIcon, {
        label: 'Command Palette', shortcut: 'Ctrl+K',
        icon: React.createElement(Command, { size: 15 }),
        onClick: () => useStore.getState().openCommandPalette(),
      }),
      // File explorer toggle
      React.createElement(ToolbarIcon, {
        label: 'File Explorer', shortcut: 'Ctrl+E',
        icon: React.createElement(FolderOpen, { size: 15 }),
        isActive: isRightPanelOpen && rightPanelTab === 'files',
        onClick: () => useStore.getState().toggleRightPanel('files'),
      }),
      // Browser preview toggle
      React.createElement(ToolbarIcon, {
        label: 'Browser Preview', shortcut: 'Ctrl+Shift+B',
        icon: React.createElement(Globe, { size: 15 }),
        isActive: isBrowserPreviewOpen,
        onClick: () => useStore.getState().toggleBrowserPreview(),
      }),
      // Changes panel toggle
      React.createElement(ToolbarIcon, {
        label: 'Changes', shortcut: 'Ctrl+Shift+C',
        icon: React.createElement(Menu, { size: 15 }),
        isActive: isRightPanelOpen && rightPanelTab === 'changes',
        onClick: () => useStore.getState().toggleRightPanel('changes'),
      }),
      // Settings
      React.createElement(ToolbarIcon, {
        label: 'Settings', shortcut: 'Ctrl+,',
        icon: React.createElement(Settings, { size: 16 }),
        onClick: () => useStore.getState().openSettings(),
      }),

      React.createElement('div', { style: { width: '8px' } }),

      // Window controls
      ...[
        { action: 'minimize', color: '#fbbf24', icon: Minus },
        { action: 'maximize', color: '#4ade80', icon: Square },
        { action: 'close', color: '#f87171', icon: X },
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
      ),
    ),
  )
}

export default TitleBar
