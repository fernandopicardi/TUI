import * as React from 'react'
import { useCallback } from 'react'
import { store } from '../store/index'
import { useStore } from '../hooks/useStore'

const Workspace: React.FC = () => {
  const selectedId = useStore(s => s.selectedWorktreeId)
  const worktrees = useStore(s => s.worktrees)
  const rootPath = useStore(s => s.rootPath)

  const worktree = worktrees.find(w => w.path === selectedId)

  const handleBack = useCallback(() => {
    store.getState().selectWorktree(null)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!rootPath || !selectedId || worktree?.isMain) return
    if (!confirm(`Deletar worktree "${worktree?.branch}"?`)) return

    try {
      await window.agentflow.git.removeWorktree(rootPath, selectedId)
      const wts = await window.agentflow.git.listWorktrees(rootPath)
      store.getState().setWorktrees(wts)
      store.getState().selectWorktree(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      store.getState().setError(msg)
    }
  }, [rootPath, selectedId, worktree])

  if (!worktree) {
    return React.createElement('div', {
      style: { padding: '24px', color: '#888' },
    }, 'Nenhum workspace selecionado')
  }

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      backgroundColor: '#0a0a0a',
    },
  },
    // Header
    React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        borderBottom: '1px solid #1f1f1f',
      },
    },
      React.createElement('button', {
        onClick: handleBack,
        style: {
          background: 'none',
          border: '1px solid #333',
          borderRadius: '4px',
          color: '#888',
          padding: '4px 12px',
          cursor: 'pointer',
          fontSize: '12px',
        },
      }, '\u2190 Voltar'),
      React.createElement('h2', {
        style: { margin: 0, fontSize: '16px', fontWeight: 600, color: '#ededed', flex: 1 },
      }, worktree.branch || 'detached'),
      !worktree.isMain
        ? React.createElement('button', {
            onClick: handleDelete,
            style: {
              background: 'none',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              color: '#ef4444',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '12px',
            },
          }, 'Deletar')
        : null
    ),

    // Content — placeholder for terminal, diff viewer, PR panel
    React.createElement('div', {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        padding: '24px',
        gap: '16px',
      },
    },
      // Info card
      React.createElement('div', {
        style: {
          backgroundColor: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: '6px',
          padding: '16px',
        },
      },
        React.createElement('div', {
          style: { fontSize: '12px', color: '#888', marginBottom: '8px' },
        }, 'PATH'),
        React.createElement('div', {
          style: { fontSize: '13px', color: '#ededed', fontFamily: 'monospace', wordBreak: 'break-all' as const },
        }, worktree.path),
      ),

      // Terminal placeholder
      React.createElement('div', {
        style: {
          flex: 1,
          backgroundColor: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#555',
          fontSize: '14px',
        },
      }, 'Terminal integrado \u2014 em breve'),

      // MCP placeholder
      React.createElement('div', {
        style: {
          backgroundColor: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '12px',
          color: '#555',
        },
      }, 'MCP Panel \u2014 em breve'),
    )
  )
}

export default Workspace
