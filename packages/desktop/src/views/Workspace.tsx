import * as React from 'react'
import { useCallback, useState, useMemo } from 'react'
import { store } from '../store/index'
import { useStore } from '../hooks/useStore'
import Terminal from '../components/Terminal'
import DiffViewer from '../components/DiffViewer'
import PRPanel from '../components/PRPanel'
import MCPPanel from '../components/MCPPanel'

type Tab = 'terminal' | 'diff' | 'pr'

const Workspace: React.FC = () => {
  const selectedId = useStore(s => s.selectedWorktreeId)
  const worktrees = useStore(s => s.worktrees)
  const rootPath = useStore(s => s.rootPath)
  const [activeTab, setActiveTab] = useState<Tab>('terminal')

  const worktree = worktrees.find(w => w.path === selectedId)

  const terminalId = useMemo(() => {
    if (!worktree) return ''
    return `term-${worktree.branch.replace(/[^a-zA-Z0-9]/g, '-')}`
  }, [worktree?.branch])

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
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '13px' },
    }, 'Selecione um workspace na sidebar')
  }

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    background: activeTab === tab ? '#1a1a1a' : 'transparent',
    border: 'none', borderRadius: '5px', padding: '4px 12px', cursor: 'pointer',
    color: activeTab === tab ? '#ededed' : '#666', fontSize: '12px',
    transition: 'all 0.15s',
  })

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', backgroundColor: '#0a0a0a' },
  },
    // Header
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', height: '40px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 },
    },
      React.createElement('button', {
        onClick: handleBack,
        style: { background: 'none', border: '1px solid #333', borderRadius: '4px', color: '#888', padding: '2px 10px', cursor: 'pointer', fontSize: '12px' },
      }, '\u2190'),
      React.createElement('span', {
        style: { fontSize: '13px', fontWeight: 500, color: '#ededed', fontFamily: 'Consolas, monospace' },
      }, worktree.branch || 'detached'),
      // Tabs
      React.createElement('div', { style: { display: 'flex', gap: '2px', marginLeft: '16px' } },
        React.createElement('button', { onClick: () => setActiveTab('terminal'), style: tabStyle('terminal') }, 'Terminal'),
        React.createElement('button', { onClick: () => setActiveTab('diff'), style: tabStyle('diff') }, 'Diff'),
        React.createElement('button', { onClick: () => setActiveTab('pr'), style: tabStyle('pr') }, 'PR'),
      ),
      React.createElement('div', { style: { flex: 1 } }),
      !worktree.isMain
        ? React.createElement('button', {
            onClick: handleDelete,
            style: { background: 'none', border: '1px solid #ef444466', borderRadius: '4px', color: '#ef4444', padding: '2px 10px', cursor: 'pointer', fontSize: '12px' },
          }, 'Deletar')
        : null,
    ),

    // Tab content
    React.createElement('div', { style: { flex: 1, overflow: 'hidden', position: 'relative' as const } },
      // Terminal — always mounted to preserve state, hidden when not active
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'terminal' ? 'block' : 'none' },
      },
        React.createElement(Terminal, { id: terminalId, worktreePath: worktree.path })
      ),
      // Diff
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'diff' ? 'flex' : 'none', flexDirection: 'column' as const },
      },
        React.createElement(DiffViewer, { worktreePath: worktree.path })
      ),
      // PR
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'pr' ? 'block' : 'none', overflow: 'auto' as const },
      },
        React.createElement(PRPanel, { worktreePath: worktree.path, branch: worktree.branch })
      ),
    ),

    // MCP Panel — always visible, collapsible
    React.createElement(MCPPanel, { worktreePath: worktree.path })
  )
}

export default Workspace
