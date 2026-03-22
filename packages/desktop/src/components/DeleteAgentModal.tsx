import * as React from 'react'
import { useState } from 'react'
import { useStore } from '../store/index'
import { Check } from 'lucide-react'

const DeleteAgentModal: React.FC = () => {
  const target = useStore(s => s.deleteAgentTarget)
  const projects = useStore(s => s.projects)

  const project = projects.find(p => p.id === target?.projectId) ?? null
  const agent = project?.agents.find(a => a.id === target?.agentId) ?? null

  const isExternal = agent?.source === 'external'
  const [removeWorktree, setRemoveWorktree] = useState(!isExternal)
  const [deleteBranch, setDeleteBranch] = useState(!isExternal)
  const [deleting, setDeleting] = useState(false)

  React.useEffect(() => {
    setRemoveWorktree(!isExternal)
    setDeleteBranch(!isExternal)
  }, [isExternal, target?.agentId])

  const handleClose = () => {
    useStore.getState().closeDeleteAgent()
  }

  const handleDelete = async () => {
    if (!agent || !project) return
    setDeleting(true)

    try {
      // 1. Kill PTY
      window.runnio?.terminal?.close(agent.terminalId)

      // 2. Remove worktree from disk
      if (removeWorktree && agent.worktreePath !== project.rootPath) {
        await window.runnio.git.removeWorktree(project.rootPath, agent.worktreePath, deleteBranch)
      }

      // 3. Remove from store
      useStore.getState().removeAgent(project.id, agent.id)
      useStore.getState().closeDeleteAgent()
      useStore.getState().showToast(`Agent "${agent.branch}" deleted`, 'success')
    } catch (err: unknown) {
      useStore.getState().showToast(
        err instanceof Error ? err.message : String(err),
        'warning'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (!agent || !project) return null

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, animation: 'fadeIn 0.15s ease-out',
  }

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)', padding: '24px', width: '380px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  }

  const checkboxRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
    fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
  }

  return React.createElement('div', {
    style: overlayStyle,
    onClick: (e: React.MouseEvent) => { if (e.target === e.currentTarget) handleClose() },
  },
    React.createElement('div', { style: modalStyle },
      React.createElement('div', {
        style: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' },
      }, `Delete agent "${agent.branch}"?`),

      React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
      },
        React.createElement('label', {
          style: checkboxRow,
          onClick: () => setRemoveWorktree(!removeWorktree),
        },
          React.createElement('span', {
            style: {
              width: '16px', height: '16px', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '11px', flexShrink: 0,
              backgroundColor: removeWorktree ? 'var(--accent)' : 'transparent',
              color: removeWorktree ? '#fff' : 'transparent',
            },
          }, React.createElement(Check, { size: 11 })),
          'Also remove worktree from disk',
        ),

        React.createElement('label', {
          style: checkboxRow,
          onClick: () => setDeleteBranch(!deleteBranch),
        },
          React.createElement('span', {
            style: {
              width: '16px', height: '16px', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '11px', flexShrink: 0,
              backgroundColor: deleteBranch ? 'var(--accent)' : 'transparent',
              color: deleteBranch ? '#fff' : 'transparent',
            },
          }, React.createElement(Check, { size: 11 })),
          'Also delete branch',
        ),
      ),

      React.createElement('div', {
        style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
      },
        React.createElement('button', {
          onClick: handleClose,
          style: {
            padding: '6px 16px', background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: 'var(--text-sm)', transition: 'all 100ms',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--border-strong)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--border-default)' },
        }, 'Cancel'),

        React.createElement('button', {
          onClick: handleDelete,
          disabled: deleting,
          style: {
            padding: '6px 16px', background: 'var(--error)', border: 'none',
            borderRadius: 'var(--radius-md)', color: '#fff', cursor: deleting ? 'wait' : 'pointer',
            fontSize: 'var(--text-sm)', transition: 'opacity 100ms',
            opacity: deleting ? 0.6 : 1,
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { if (!deleting) e.currentTarget.style.opacity = '0.85' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { if (!deleting) e.currentTarget.style.opacity = '1' },
        }, deleting ? 'Deleting...' : 'Delete'),
      ),
    )
  )
}

export default DeleteAgentModal
