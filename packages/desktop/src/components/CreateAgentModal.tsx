import * as React from 'react'
import { useState, useCallback } from 'react'
import { useStore } from '../store/index'

const CreateAgentModal: React.FC = () => {
  const [input, setInput] = useState('')
  const [createWorktree, setCreateWorktree] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeProject = useStore(s => s.getActiveProject())

  const onClose = useCallback(() => {
    useStore.getState().closeCreateAgent()
  }, [])

  const isValidBranch = (name: string): boolean => {
    if (!name || name.endsWith('/') || name.endsWith('.') || name.startsWith('-')) return false
    if (/\.\./.test(name) || /[\x00-\x1f\x7f ~^:?*\\[\]]/.test(name)) return false
    if (name.includes('@{') || name === '@') return false
    if (name.endsWith('.lock')) return false
    return true
  }

  const handleCreate = useCallback(async () => {
    const branchName = input.trim()
    if (!branchName || !activeProject) return

    if (!isValidBranch(branchName)) {
      setError(`"${branchName}" is not a valid branch name.`)
      return
    }

    setCreating(true)
    setError(null)

    let worktreePath = activeProject.rootPath

    if (createWorktree) {
      const result = await window.runnio.git.createWorktree(
        activeProject.rootPath,
        branchName
      )
      if (!result.success) {
        setError(result.error || 'Failed to create worktree')
        setCreating(false)
        return
      }
      worktreePath = result.path!
    }

    const agentId = `${activeProject.id}-${branchName.replace(/\//g, '-')}`

    useStore.getState().addAgent(activeProject.id, {
      id: agentId,
      projectId: activeProject.id,
      branch: branchName,
      worktreePath,
      status: 'idle',
      terminalId: agentId,
      isTerminalAlive: false,
    })

    useStore.getState().setActiveAgent(agentId)
    useStore.getState().showToast(`Agent "${branchName}" created`, 'success')
    setCreating(false)
    onClose()
  }, [input, createWorktree, activeProject, onClose])

  if (!activeProject) return null

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    },
    onClick: onClose,
  },
    React.createElement('div', {
      style: {
        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
        padding: '24px', width: '420px', display: 'flex',
        flexDirection: 'column' as const, gap: '16px',
        animation: 'fadeIn 0.15s ease-out',
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
      React.createElement('h3', {
        style: { margin: 0, color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 600 },
      }, `New agent \u2014 ${activeProject.name}`),

      // Branch name input
      React.createElement('div', null,
        React.createElement('label', {
          style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '6px' },
        }, 'Branch name'),
        React.createElement('input', {
          type: 'text',
          value: input,
          placeholder: 'feature/my-task',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') handleCreate()
            if (e.key === 'Escape') onClose()
          },
          autoFocus: true,
          style: {
            width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--text-disabled)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 'var(--text-md)', outline: 'none', fontFamily: 'Consolas, monospace',
            boxSizing: 'border-box',
          },
        })
      ),

      // Create worktree checkbox
      React.createElement('label', {
        style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
      },
        React.createElement('input', {
          type: 'checkbox',
          checked: createWorktree,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCreateWorktree(e.target.checked),
          style: { accentColor: 'var(--accent)' },
        }),
        React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-base)' } }, 'Create isolated worktree'),
      ),
      React.createElement('div', {
        style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '-12px', paddingLeft: '24px' },
      }, 'Recommended for parallel work'),

      // Error
      error
        ? React.createElement('p', { style: { color: 'var(--error)', fontSize: 'var(--text-sm)', margin: 0 } }, error)
        : null,

      // Buttons
      React.createElement('div', {
        style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
      },
        React.createElement('button', {
          onClick: onClose,
          style: {
            padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--text-disabled)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-base)',
            transition: 'all 100ms',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-secondary)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-disabled)' },
        }, 'Cancel'),
        React.createElement('button', {
          onClick: handleCreate,
          disabled: creating || !input.trim(),
          style: {
            padding: '8px 16px', backgroundColor: 'var(--accent)', border: 'none',
            borderRadius: 'var(--radius-md)', color: '#fff',
            cursor: creating || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 'var(--text-base)', opacity: creating || !input.trim() ? 0.5 : 1,
            transition: 'opacity 150ms, transform 80ms',
          },
          onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => { if (!creating && input.trim()) e.currentTarget.style.transform = 'scale(0.97)' },
          onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = 'scale(1)' },
        }, creating ? 'Creating...' : 'Create agent')
      )
    )
  )
}

export default CreateAgentModal
