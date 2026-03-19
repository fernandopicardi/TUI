import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { store } from './store/index'
import { useStore } from './hooks/useStore'
import TitleBar from './components/TitleBar'
import Toast from './components/Toast'
import OpenProjectModal from './components/OpenProjectModal'
import QuickPrompt from './components/QuickPrompt'
import CommandPalette from './components/CommandPalette'
import Welcome from './views/Welcome'
import Dashboard from './views/Dashboard'
import Workspace from './views/Workspace'

const App: React.FC = () => {
  const activeView = useStore(s => s.activeView)
  const rootPath = useStore(s => s.rootPath)
  const pluginContext = useStore(s => s.pluginContext)
  const error = useStore(s => s.error)
  const toasts = useStore(s => s.toasts)
  const [preloadOk, setPreloadOk] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showQuickPrompt, setShowQuickPrompt] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  const projectName = pluginContext?.summary
    ? pluginContext.summary.split('\u2014')[0]?.trim()
    : rootPath ? rootPath.split(/[\\/]/).pop() : undefined

  useEffect(() => {
    if (window.agentflow) setPreloadOk(true)
    else console.error('[agentflow] PRELOAD FAILED')
  }, [])

  const handleOpenLocal = useCallback(async () => {
    if (!window.agentflow?.dialog) return
    const selectedPath = await window.agentflow.dialog.openDirectory()
    if (!selectedPath) return
    try {
      const config = await window.agentflow.config.load(selectedPath)
      store.getState().setConfig(config)
      store.getState().setRootPath(selectedPath)
      store.getState().addRecentProject(selectedPath)
    } catch (err: unknown) {
      store.getState().setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement)?.matches?.('input,textarea')

      if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); setShowQuickPrompt(true); return }
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setShowCommandPalette(true); return }
      if (e.ctrlKey && e.key === 'w') { e.preventDefault(); store.getState().selectWorktree(null); return }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault()
        const rp = store.getState().rootPath
        if (rp && window.agentflow) {
          window.agentflow.git.listWorktrees(rp).then(wts => store.getState().setWorktrees(wts))
          store.getState().showToast('Refresh...', 'info')
        }
        return
      }
      if (e.key === '?' && !e.ctrlKey && !isInput) { setShowShortcuts(v => !v); return }
      if (e.key === 'Escape') { setShowShortcuts(false); setShowQuickPrompt(false); setShowCommandPalette(false); setShowOpenModal(false); return }
      if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        const wts = store.getState().worktrees
        const idx = parseInt(e.key) - 1
        if (wts[idx]) store.getState().selectWorktree(wts[idx].path)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return React.createElement('div', {
    style: {
      display: 'flex', flexDirection: 'column' as const, height: '100vh',
      backgroundColor: '#0a0a0a', color: '#ededed',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize: '14px', overflow: 'hidden',
    },
  },
    React.createElement(TitleBar, { projectName }),

    !preloadOk
      ? React.createElement('div', {
          style: { padding: '12px 16px', backgroundColor: '#1a0000', borderBottom: '1px solid #ef4444', color: '#ef4444', fontSize: '12px' },
        }, 'Erro: preload n\u00E3o carregou. Reinicie o app.')
      : null,

    error
      ? React.createElement('div', {
          style: {
            padding: '8px 16px', backgroundColor: 'rgba(239,68,68,0.08)',
            borderBottom: '1px solid #ef444433', color: '#ef4444', fontSize: '12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          },
        },
          React.createElement('span', null, error),
          React.createElement('button', {
            onClick: () => store.getState().setError(null),
            style: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px' },
          }, '\u00D7')
        )
      : null,

    // Content
    React.createElement('div', { style: { flex: 1, overflow: 'hidden' } },
      activeView === 'welcome'
        ? React.createElement(Welcome, { onOpenProject: () => setShowOpenModal(true) })
        : activeView === 'workspace'
          ? React.createElement(Workspace)
          : React.createElement(Dashboard)
    ),

    // Toasts
    ...toasts.map((t) =>
      React.createElement(Toast, {
        key: t.id, message: t.message, type: t.type,
        onDismiss: () => store.getState().dismissToast(t.id),
      })
    ),

    // Open Project modal
    showOpenModal
      ? React.createElement(OpenProjectModal, {
          onClose: () => setShowOpenModal(false),
          onOpenLocal: handleOpenLocal,
        })
      : null,

    // Quick Prompt
    showQuickPrompt
      ? React.createElement(QuickPrompt, { onClose: () => setShowQuickPrompt(false) })
      : null,

    // Command Palette
    showCommandPalette
      ? React.createElement(CommandPalette, {
          onClose: () => setShowCommandPalette(false),
          onOpenLocal: handleOpenLocal,
          onOpenClone: () => { setShowCommandPalette(false); setShowOpenModal(true) },
        })
      : null,

    // Shortcuts cheatsheet
    showShortcuts
      ? React.createElement('div', {
          style: {
            position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 200,
          },
          onClick: () => setShowShortcuts(false),
        },
          React.createElement('div', {
            style: {
              backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: '12px',
              padding: '24px 32px', minWidth: '340px', animation: 'fadeIn 0.12s ease-out',
            },
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
            React.createElement('h3', {
              style: { margin: '0 0 16px', color: '#ededed', fontSize: '16px', fontWeight: 600 },
            }, 'Atalhos'),
            ...([
              ['Ctrl+K', 'Command palette'],
              ['Ctrl+Space', 'Quick prompt'],
              ['Ctrl+W', 'Fechar workspace'],
              ['Ctrl+R', 'Refresh worktrees'],
              ['Ctrl+1\u20145', 'Selecionar worktree'],
              ['?', 'Mostrar/ocultar atalhos'],
              ['Esc', 'Fechar modal'],
            ] as [string, string][]).map(([key, desc]) =>
              React.createElement('div', {
                key,
                style: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' },
              },
                React.createElement('kbd', {
                  style: { background: '#1f1f1f', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#ededed', fontFamily: 'Consolas, monospace' },
                }, key),
                React.createElement('span', { style: { color: '#888', fontSize: '13px' } }, desc)
              )
            )
          )
        )
      : null
  )
}

export default App
