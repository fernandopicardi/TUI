import * as React from 'react'
import { useCallback, useState, useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import Terminal from '../components/Terminal'
import DiffViewer from '../components/DiffViewer'
import PRPanel from '../components/PRPanel'
import MCPPanel from '../components/MCPPanel'
import WorkspaceNotes from '../components/WorkspaceNotes'

type Tab = 'terminal' | 'diff' | 'pr' | 'notes'

interface Props {
  agentId: string
}

const Workspace: React.FC<Props> = ({ agentId }) => {
  // Find this specific agent and its project
  const agent = useStore(s => {
    for (const p of s.projects) {
      const a = p.agents.find(ag => ag.id === agentId)
      if (a) return a
    }
    return null
  })
  const project = useStore(s => {
    return s.projects.find(p => p.agents.some(a => a.id === agentId)) ?? null
  })
  const initPrompt = useStore(s => s.initPrompt)
  const isActive = useStore(s => s.activeAgentId === agentId)
  const [activeTab, setActiveTab] = useState<Tab>('terminal')

  const terminalId = useMemo(() => {
    if (!agent) return ''
    return agent.terminalId
  }, [agent?.terminalId])

  // Clear initPrompt after pickup — only for the active agent
  React.useEffect(() => {
    if (initPrompt && isActive) {
      const timer = setTimeout(() => useStore.getState().setInitPrompt(null), 100)
      return () => clearTimeout(timer)
    }
  }, [initPrompt, isActive])

  const handleBack = useCallback(() => {
    useStore.getState().setActiveAgent(null)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!agent || !project) return
    if (!confirm(`Delete agent "${agent.branch}"?`)) return
    try {
      // Explicitly close pty in main process
      window.agentflow?.terminal?.close(agent.terminalId)
      // Remove worktree if not main project path
      if (agent.worktreePath !== project.rootPath) {
        await window.agentflow.git.removeWorktree(project.rootPath, agent.worktreePath)
      }
      useStore.getState().removeAgent(project.id, agent.id)
    } catch (err: unknown) {
      useStore.getState().showToast(
        err instanceof Error ? err.message : String(err),
        'warning'
      )
    }
  }, [agent, project])

  if (!agent || !project) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '13px' },
    }, 'Agent not found')
  }

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    background: activeTab === tab ? '#1a1a1a' : 'transparent',
    border: 'none', borderRadius: '5px', padding: '4px 12px', cursor: 'pointer',
    color: activeTab === tab ? '#ededed' : '#666', fontSize: '12px',
    transition: 'all 0.15s',
  })

  // Only pass initialPrompt if this is the active agent and prompt exists
  const effectivePrompt = isActive ? (initPrompt || undefined) : undefined

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
      }, project.name),
      React.createElement('span', { style: { color: '#333', fontSize: '12px' } }, '/'),
      React.createElement('span', {
        style: { fontSize: '13px', fontWeight: 500, color: '#ededed', fontFamily: 'Consolas, monospace' },
      }, agent.branch || 'detached'),
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
      // Terminal — always mounted to preserve state, hidden when not active tab
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'terminal' ? 'block' : 'none' },
      },
        React.createElement(Terminal, {
          id: terminalId,
          worktreePath: agent.worktreePath,
          initialPrompt: effectivePrompt,
        })
      ),
      // Diff
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'diff' ? 'flex' : 'none', flexDirection: 'column' as const },
      },
        React.createElement(DiffViewer, { worktreePath: agent.worktreePath })
      ),
      // PR
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'pr' ? 'block' : 'none', overflow: 'auto' as const },
      },
        React.createElement(PRPanel, { worktreePath: agent.worktreePath, branch: agent.branch })
      ),
      // Notes
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'notes' ? 'block' : 'none' },
      },
        React.createElement(WorkspaceNotes, { branch: agent.branch, rootPath: project.rootPath })
      ),
    ),

    // MCP Panel
    React.createElement(MCPPanel, { worktreePath: agent.worktreePath })
  )
}

export default Workspace
