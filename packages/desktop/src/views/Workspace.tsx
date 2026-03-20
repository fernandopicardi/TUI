import * as React from 'react'
import { useCallback, useState, useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import Terminal from '../components/Terminal'
import DiffViewer from '../components/DiffViewer'
import PRPanel from '../components/PRPanel'
import FileTree from '../components/FileTree'
import MCPPanel from '../components/MCPPanel'
import WorkspaceNotes from '../components/WorkspaceNotes'

type Tab = 'terminal' | 'files' | 'diff' | 'pr' | 'notes'

interface Props {
  agentId: string
}

const Workspace: React.FC<Props> = ({ agentId }) => {
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

  // Clear initPrompt after pickup
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
      window.agentflow?.terminal?.close(agent.terminalId)
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
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-base)' },
    }, 'Agent not found')
  }

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    background: 'transparent', border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    padding: '4px 12px', cursor: 'pointer',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 'var(--text-sm)',
    transition: 'all 150ms',
  })

  const effectivePrompt = isActive ? (initPrompt || undefined) : undefined

  const statusColor = agent.status === 'working' ? 'var(--working)'
    : agent.status === 'waiting' ? 'var(--waiting)'
    : agent.status === 'done' ? 'var(--done)'
    : 'var(--text-disabled)'

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', backgroundColor: '#0a0a0a' },
  },
    // Header
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', height: '40px',
        borderBottom: '1px solid var(--border-default)', flexShrink: 0,
      },
    },
      React.createElement('button', {
        onClick: handleBack,
        style: {
          background: 'none', border: '1px solid var(--text-disabled)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)', padding: '2px 10px', cursor: 'pointer', fontSize: 'var(--text-sm)',
          transition: 'all 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-secondary)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-disabled)' },
      }, '\u2190'),
      React.createElement('span', {
        style: { fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'Consolas, monospace' },
      }, agent.branch || 'detached'),
      React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-sm)' } }, '\u00B7'),
      React.createElement('span', { style: { fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' } }, project.name),
      // Status badge
      React.createElement('span', {
        style: {
          display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: statusColor,
        },
      },
        React.createElement('span', {
          style: {
            width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor,
            animation: agent.status === 'working' ? 'pulse 2s infinite' : agent.status === 'waiting' ? 'pulseFast 1s infinite' : 'none',
          },
        }),
        agent.status,
      ),
      // Tabs
      React.createElement('div', { style: { display: 'flex', gap: '2px', marginLeft: '16px' } },
        React.createElement('button', { onClick: () => setActiveTab('terminal'), style: tabStyle('terminal') }, 'Terminal'),
        React.createElement('button', { onClick: () => setActiveTab('files'), style: tabStyle('files') }, 'Files'),
        React.createElement('button', { onClick: () => setActiveTab('diff'), style: tabStyle('diff') }, 'Diff'),
        React.createElement('button', { onClick: () => setActiveTab('pr'), style: tabStyle('pr') }, 'PR'),
        React.createElement('button', { onClick: () => setActiveTab('notes'), style: tabStyle('notes') }, 'Notes'),
      ),
      React.createElement('div', { style: { flex: 1 } }),
      React.createElement('button', {
        onClick: handleDelete,
        style: {
          background: 'none', border: '1px solid #ef444466', borderRadius: 'var(--radius-sm)',
          color: 'var(--error)', padding: '2px 10px', cursor: 'pointer', fontSize: 'var(--text-sm)',
          transition: 'all 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--error)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = '#ef444466' },
      }, 'Delete'),
    ),

    // Tab content
    React.createElement('div', { style: { flex: 1, overflow: 'hidden', position: 'relative' as const } },
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'terminal' ? 'block' : 'none' },
      },
        React.createElement(Terminal, {
          id: terminalId,
          worktreePath: agent.worktreePath,
          initialPrompt: effectivePrompt,
        })
      ),
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'files' ? 'flex' : 'none' },
      },
        React.createElement(FileTree, { worktreePath: agent.worktreePath })
      ),
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'diff' ? 'flex' : 'none', flexDirection: 'column' as const },
      },
        React.createElement(DiffViewer, { worktreePath: agent.worktreePath, visible: activeTab === 'diff' })
      ),
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'pr' ? 'block' : 'none', overflow: 'auto' as const },
      },
        React.createElement(PRPanel, { worktreePath: agent.worktreePath, branch: agent.branch })
      ),
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
