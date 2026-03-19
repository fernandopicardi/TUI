import * as React from 'react'
import { useCallback, useEffect } from 'react'
import { store } from './store/index'
import { useStore } from './hooks/useStore'
import TitleBar from './components/TitleBar'
import Welcome from './views/Welcome'
import Dashboard from './views/Dashboard'
import Workspace from './views/Workspace'

const App: React.FC = () => {
  const activeView = useStore(s => s.activeView)
  const rootPath = useStore(s => s.rootPath)
  const pluginContext = useStore(s => s.pluginContext)
  const error = useStore(s => s.error)

  const projectName = pluginContext?.summary || (rootPath ? rootPath.split(/[\\/]/).pop() : undefined)

  const handleOpenProject = useCallback(async () => {
    const path = await window.agentflow.dialog.openDirectory()
    if (path) {
      const config = await window.agentflow.config.load(path)
      store.getState().setConfig(config)
      store.getState().setRootPath(path)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        // Trigger new worktree — handled in Dashboard
      }
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault()
        store.getState().selectWorktree(null)
      }
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault()
        if (rootPath) {
          window.agentflow.git.listWorktrees(rootPath).then((wts) => {
            store.getState().setWorktrees(wts)
          })
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [rootPath])

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ededed',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize: '14px',
      overflow: 'hidden',
    },
  },
    // Title bar
    React.createElement(TitleBar, { projectName }),

    // Error banner
    error
      ? React.createElement('div', {
          style: {
            padding: '8px 16px',
            backgroundColor: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid #ef4444',
            color: '#ef4444',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
          },
        },
          React.createElement('span', null, error),
          React.createElement('button', {
            onClick: () => store.getState().setError(null),
            style: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
          }, '\u00D7')
        )
      : null,

    // Content
    React.createElement('div', {
      style: { flex: 1, overflow: 'hidden' },
    },
      activeView === 'welcome'
        ? React.createElement(Welcome, { onOpenProject: handleOpenProject })
        : activeView === 'workspace'
          ? React.createElement(Workspace)
          : React.createElement(Dashboard)
    )
  )
}

export default App
