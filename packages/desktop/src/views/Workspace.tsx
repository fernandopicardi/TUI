import * as React from 'react'
import { useCallback, useState } from 'react'
import { store } from '../store/index'
import { useStore } from '../hooks/useStore'
import Terminal from '../components/Terminal'
import DiffViewer from '../components/DiffViewer'

type Tab = 'terminal' | 'diff' | 'pr'

const Workspace: React.FC = () => {
  const selectedId = useStore(s => s.selectedWorktreeId)
  const worktrees = useStore(s => s.worktrees)
  const rootPath = useStore(s => s.rootPath)
  const [activeTab, setActiveTab] = useState<Tab>('terminal')

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
      store.getState().setError(err instanceof Error ? err.message : String(err))
    }
  }, [rootPath, selectedId, worktree])

  if (!worktree) {
    return React.createElement('div', { style: { padding: '24px', color: '#888' } }, 'Nenhum workspace selecionado')
  }

  const terminalId = `term-${worktree.branch.replace(/[^a-zA-Z0-9]/g, '-')}`

  const tabStyle = (tab: Tab) => ({
    background: activeTab === tab ? '#1f1f1f' : 'transparent',
    border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer' as const,
    color: activeTab === tab ? '#ededed' : '#888', fontSize: '13px',
  })

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', backgroundColor: '#0a0a0a' },
  },
    // Header
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #1f1f1f' },
    },
      React.createElement('button', {
        onClick: handleBack,
        style: { background: 'none', border: '1px solid #333', borderRadius: '4px', color: '#888', padding: '4px 12px', cursor: 'pointer', fontSize: '12px' },
      }, '\u2190 Voltar'),
      React.createElement('span', {
        style: { fontSize: '14px', fontWeight: 600, color: '#ededed', flex: 1 },
      }, worktree.branch || 'detached'),
      // Tabs
      React.createElement('div', { style: { display: 'flex', gap: '4px' } },
        React.createElement('button', { onClick: () => setActiveTab('terminal'), style: tabStyle('terminal') }, 'Terminal'),
        React.createElement('button', { onClick: () => setActiveTab('diff'), style: tabStyle('diff') }, 'Diff'),
        React.createElement('button', { onClick: () => setActiveTab('pr'), style: tabStyle('pr') }, 'PR'),
      ),
      !worktree.isMain
        ? React.createElement('button', {
            onClick: handleDelete,
            style: { background: 'none', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', padding: '4px 12px', cursor: 'pointer', fontSize: '12px' },
          }, 'Deletar')
        : null,
    ),

    // Tab content
    React.createElement('div', { style: { flex: 1, overflow: 'hidden' } },
      activeTab === 'terminal'
        ? React.createElement(Terminal, { id: terminalId, worktreePath: worktree.path })
        : activeTab === 'diff'
          ? React.createElement(DiffViewer, { worktreePath: worktree.path })
          : React.createElement('div', {
              style: { padding: '24px', color: '#888', fontSize: '13px' },
            }, 'PR flow \u2014 configure GITHUB_TOKEN em agentflow.config.json para ativar')
    )
  )
}

export default Workspace
