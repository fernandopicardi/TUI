import * as React from 'react'
import { useState, useCallback } from 'react'
import { store } from '../store/index'
import { useStore } from '../hooks/useStore'
import { useWorktreeWatcher } from '../hooks/useWorktrees'
import { useAgentStatusWatcher } from '../hooks/useAgentStatus'
import { usePluginLoader } from '../hooks/usePlugin'
import Sidebar from '../components/Sidebar'
import ContextPanel from '../components/ContextPanel/index'
import InitBanner from '../components/InitBanner'
import AgentStatusBadge from '../components/AgentStatusBadge'
import { INIT_PROMPTS } from '../data/initPrompts'
import { AgentStatusValue } from '../types'

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

  const handleInitTemplate = useCallback((template: string) => {
    const prompt = INIT_PROMPTS[template]
    if (!prompt || !worktrees[0]) return
    store.getState().setInitPrompt(prompt)
    store.getState().selectWorktree(worktrees[0].path)
  }, [worktrees])

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
      store.getState().showToast(`Worktree "${branchName}" criado`, 'success')
    } catch (err: unknown) {
      store.getState().setError(err instanceof Error ? err.message : String(err))
    }
    setCreating(false)
  }, [rootPath, newBranch])

  const isRawPlugin = pluginName === 'raw'

  return React.createElement('div', {
    style: { display: 'flex', height: '100%' },
  },
    // Sidebar
    React.createElement(Sidebar, {
      worktrees, statuses, selectedId, pluginName,
      onSelect: handleSelect,
      onNewWorktree: () => setShowNewForm(true),
    }),

    // Main content
    React.createElement('main', {
      style: { flex: 1, backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
    },
      // Context panel (when plugin has context)
      !isRawPlugin ? React.createElement(ContextPanel, { pluginName, context: pluginContext }) : null,

      // Init banner (when raw plugin)
      isRawPlugin ? React.createElement(InitBanner, { onSelect: handleInitTemplate }) : null,

      // Workspace grid
      React.createElement('div', {
        style: {
          flex: 1, padding: '16px', overflowY: 'auto' as const,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px', alignContent: 'start',
        },
      },
        ...worktrees.map((wt) => {
          const status = (statuses[wt.path] || 'idle') as AgentStatusValue
          const isSelected = wt.path === selectedId
          return React.createElement('div', {
            key: wt.path,
            onClick: () => handleSelect(wt.path),
            style: {
              display: 'flex', flexDirection: 'column' as const, gap: '10px',
              padding: '16px', backgroundColor: isSelected ? '#161622' : '#111',
              border: `1px solid ${isSelected ? '#5b6af044' : '#1a1a1a'}`,
              borderRadius: '8px', cursor: 'pointer', transition: 'all 150ms',
            },
            onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
              if (!isSelected) (e.currentTarget).style.borderColor = '#2a2a2a'
            },
            onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
              if (!isSelected) (e.currentTarget).style.borderColor = '#1a1a1a'
            },
          },
            // Status row
            React.createElement('div', {
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
            },
              React.createElement(AgentStatusBadge, { status }),
              wt.isMain
                ? React.createElement('span', {
                    style: { fontSize: '10px', color: '#444', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
                  }, 'main')
                : null
            ),
            // Branch name
            React.createElement('div', {
              style: { fontSize: '14px', fontWeight: 500, color: '#ededed', fontFamily: 'Consolas, monospace' },
            }, wt.branch || 'detached'),
            // Arrow
            React.createElement('div', {
              style: { display: 'flex', justifyContent: 'flex-end' },
            },
              React.createElement('span', { style: { color: '#333', fontSize: '14px' } }, '\u2192')
            )
          )
        })
      ),

      // New worktree modal
      showNewForm
        ? React.createElement('div', {
            style: {
              position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 100,
            },
            onClick: () => setShowNewForm(false),
          },
            React.createElement('div', {
              style: {
                backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: '12px',
                padding: '24px', width: '400px', display: 'flex',
                flexDirection: 'column' as const, gap: '16px',
              },
              onClick: (e: React.MouseEvent) => e.stopPropagation(),
            },
              React.createElement('h3', {
                style: { margin: 0, color: '#ededed', fontSize: '16px', fontWeight: 600 },
              }, 'Novo worktree'),
              React.createElement('input', {
                type: 'text', placeholder: 'Nome do branch...',
                value: newBranch,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewBranch(e.target.value),
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') setShowNewForm(false)
                },
                autoFocus: true,
                style: {
                  padding: '10px 14px', backgroundColor: '#0a0a0a', border: '1px solid #333',
                  borderRadius: '6px', color: '#ededed', fontSize: '14px', outline: 'none',
                  fontFamily: 'Consolas, monospace',
                },
              }),
              React.createElement('div', {
                style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
              },
                React.createElement('button', {
                  onClick: () => setShowNewForm(false),
                  style: {
                    padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #333',
                    borderRadius: '6px', color: '#888', cursor: 'pointer', fontSize: '13px',
                  },
                }, 'Cancelar'),
                React.createElement('button', {
                  onClick: handleCreate, disabled: creating || !newBranch.trim(),
                  style: {
                    padding: '8px 16px', backgroundColor: '#5b6af0', border: 'none',
                    borderRadius: '6px', color: '#fff', cursor: creating ? 'not-allowed' : 'pointer',
                    fontSize: '13px', opacity: creating || !newBranch.trim() ? 0.5 : 1,
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
