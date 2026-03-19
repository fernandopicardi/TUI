import * as React from 'react'
import { useCallback, useState, useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import Terminal from '../components/Terminal'
import DiffViewer from '../components/DiffViewer'
import PRPanel from '../components/PRPanel'
import MCPPanel from '../components/MCPPanel'
import WorkspaceNotes from '../components/WorkspaceNotes'

type Tab = 'terminal' | 'diff' | 'pr' | 'notes'

const Workspace: React.FC = () => {
  const activeAgent = useStore(s => s.getActiveAgent())
  const activeProject = useStore(s => s.getActiveProject())
  const initPrompt = useStore(s => s.initPrompt)
  const [activeTab, setActiveTab] = useState<Tab>('terminal')

  const terminalId = useMemo(() => {
    if (!activeAgent) return ''
    return activeAgent.terminalId
  }, [activeAgent?.terminalId])

  // Clear initPrompt after navigation to workspace
  React.useEffect(() => {
    if (initPrompt) {
      const timer = setTimeout(() => useStore.getState().setInitPrompt(null), 100)
      return () => clearTimeout(timer)
    }
  }, [initPrompt])

  const handleBack = useCallback(() => {
    useStore.getState().setActiveAgent(null)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!activeAgent || !activeProject) return
    if (!confirm(`Delete agent "${activeAgent.branch}"?`)) return
    try {
      // Close terminal
      window.agentflow?.terminal?.close(activeAgent.terminalId)
      // Remove worktree if not main project path
      if (activeAgent.worktreePath !== activeProject.rootPath) {
        await window.agentflow.git.removeWorktree(activeProject.rootPath, activeAgent.worktreePath)
      }
      useStore.getState().removeAgent(activeProject.id, activeAgent.id)
    } catch (err: unknown) {
      useStore.getState().showToast(
        err instanceof Error ? err.message : String(err),
        'warning'
      )
    }
  }, [activeAgent, activeProject])

  if (!activeAgent || !activeProject) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '13px' },
    }, 'Select an agent in the sidebar')
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
        style: { fontSize: '11px', color: '#555' },
      }, activeProject.name),
      React.createElement('span', { style: { color: '#333', fontSize: '12px' } }, '/'),
      React.createElement('span', {
        style: { fontSize: '13px', fontWeight: 500, color: '#ededed', fontFamily: 'Consolas, monospace' },
      }, activeAgent.branch || 'detached'),
      // Tabs
      React.createElement('div', { style: { display: 'flex', gap: '2px', marginLeft: '16px' } },
        React.createElement('button', { onClick: () => setActiveTab('terminal'), style: tabStyle('terminal') }, 'Terminal'),
        React.createElement('button', { onClick: () => setActiveTab('diff'), style: tabStyle('diff') }, 'Diff'),
        React.createElement('button', { onClick: () => setActiveTab('pr'), style: tabStyle('pr') }, 'PR'),
        React.createElement('button', { onClick: () => setActiveTab('notes'), style: tabStyle('notes') }, 'Notes'),
      ),
      React.createElement('div', { style: { flex: 1 } }),
      React.createElement('button', {
        onClick: handleDelete,
        style: { background: 'none', border: '1px solid #ef444466', borderRadius: '4px', color: '#ef4444', padding: '2px 10px', cursor: 'pointer', fontSize: '12px' },
      }, 'Delete'),
    ),

    // Tab content
    React.createElement('div', { style: { flex: 1, overflow: 'hidden', position: 'relative' as const } },
      // Terminal — always mounted to preserve state, hidden when not active
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'terminal' ? 'block' : 'none' },
      },
        React.createElement(Terminal, {
          id: terminalId,
          worktreePath: activeAgent.worktreePath,
          initialPrompt: initPrompt || undefined,
        })
      ),
      // Diff
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'diff' ? 'flex' : 'none', flexDirection: 'column' as const },
      },
        React.createElement(DiffViewer, { worktreePath: activeAgent.worktreePath })
      ),
      // PR
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'pr' ? 'block' : 'none', overflow: 'auto' as const },
      },
        React.createElement(PRPanel, { worktreePath: activeAgent.worktreePath, branch: activeAgent.branch })
      ),
      // Notes
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'notes' ? 'block' : 'none' },
      },
        React.createElement(WorkspaceNotes, { branch: activeAgent.branch, rootPath: activeProject.rootPath })
      ),
    ),

    // MCP Panel — always visible, collapsible
    React.createElement(MCPPanel, { worktreePath: activeAgent.worktreePath })
  )
}

export default Workspace
