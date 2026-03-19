import * as React from 'react'
import { useState, useCallback } from 'react'
import { store } from '../store/index'
import { useStore } from '../hooks/useStore'
import { useWorktreeWatcher } from '../hooks/useWorktrees'
import { useAgentStatusWatcher } from '../hooks/useAgentStatus'
import { usePluginLoader } from '../hooks/usePlugin'
import Sidebar from '../components/Sidebar'
import ContextPanel from '../components/ContextPanel/index'
import WorkspaceCard from '../components/WorkspaceCard'

const Dashboard: React.FC = () => {
  const rootPath = useStore(s => s.rootPath)
  const worktrees = useStore(s => s.worktrees)
  const statuses = useStore(s => s.agentStatuses)
  const selectedId = useStore(s => s.selectedWorktreeId)
  const pluginName = useStore(s => s.pluginName)
  const pluginContext = useStore(s => s.pluginContext)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newBranch, setNewBranch] = useState('')
  const [creating, setCreating] = useState(false)

  useWorktreeWatcher(rootPath)
  useAgentStatusWatcher(worktrees)
  usePluginLoader(rootPath)

  const handleSelect = useCallback((path: string) => {
    store.getState().selectWorktree(path)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!rootPath || !newBranch.trim()) return
    setCreating(true)
    try {
      const branchName = newBranch.trim().replace(/\s+/g, '-').toLowerCase()
      await window.agentflow.git.createWorktree(rootPath, branchName)
      const wts = await window.agentflow.git.listWorktrees(rootPath)
      store.getState().setWorktrees(wts)
      setNewBranch('')
      setShowNewForm(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      store.getState().setError(msg)
    }
    setCreating(false)
  }, [rootPath, newBranch])

  return React.createElement('div', {
    style: {
      display: 'flex',
      height: '100%',
    },
  },
    // Sidebar
    React.createElement(Sidebar, {
      worktrees,
      statuses,
      selectedId,
      onSelect: handleSelect,
      onNewWorktree: () => setShowNewForm(true),
    }),

    // Main content area
    React.createElement('main', {
      style: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
      },
    },
      // Context panel
      React.createElement(ContextPanel, { pluginName, context: pluginContext }),

      // Workspace grid
      React.createElement('div', {
        style: {
          flex: 1,
          padding: '16px',
          overflowY: 'auto' as const,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
          alignContent: 'start',
        },
      },
        ...worktrees.map((wt) =>
          React.createElement(WorkspaceCard, {
            key: wt.path,
            worktree: wt,
            status: (statuses[wt.path] || 'idle') as any,
            isSelected: wt.path === selectedId,
            onClick: () => handleSelect(wt.path),
          })
        )
      ),

      // New worktree form (overlay)
      showNewForm
        ? React.createElement('div', {
            style: {
              position: 'fixed' as const,
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            },
            onClick: () => setShowNewForm(false),
          },
            React.createElement('div', {
              style: {
                backgroundColor: '#111',
                border: '1px solid #1f1f1f',
                borderRadius: '8px',
                padding: '24px',
                width: '400px',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '16px',
              },
              onClick: (e: React.MouseEvent) => e.stopPropagation(),
            },
              React.createElement('h3', {
                style: { margin: 0, color: '#ededed', fontSize: '16px' },
              }, 'Novo worktree'),
              React.createElement('input', {
                type: 'text',
                placeholder: 'Nome do branch...',
                value: newBranch,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewBranch(e.target.value),
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') setShowNewForm(false)
                },
                autoFocus: true,
                style: {
                  padding: '8px 12px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#ededed',
                  fontSize: '14px',
                  outline: 'none',
                },
              }),
              React.createElement('div', {
                style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
              },
                React.createElement('button', {
                  onClick: () => setShowNewForm(false),
                  style: {
                    padding: '6px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '13px',
                  },
                }, 'Cancelar'),
                React.createElement('button', {
                  onClick: handleCreate,
                  disabled: creating || !newBranch.trim(),
                  style: {
                    padding: '6px 16px',
                    backgroundColor: '#5b6af0',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    opacity: creating || !newBranch.trim() ? 0.5 : 1,
                  },
                }, creating ? 'Criando...' : 'Criar')
              )
            )
          )
        : null
    )
  )
}

export default Dashboard
