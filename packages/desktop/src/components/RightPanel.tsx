import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../store/index'
import { FolderOpen, GitCompareArrows, GitPullRequest, StickyNote, GitBranch, Plus, Check, RefreshCw, X } from 'lucide-react'
import FileTree from './FileTree'
import DiffViewer from './DiffViewer'
import PRPanel from './PRPanel'
import WorkspaceNotes from './WorkspaceNotes'
import UpgradeGate from './UpgradeGate'

type RightPanelTab = 'files' | 'diff' | 'pr' | 'notes' | 'changes'

interface Props {
  worktreePath: string
  branch: string
  rootPath: string
}

const PANEL_WIDTH = 420

// ── Changes tab content ──
const ChangesView: React.FC<{ worktreePath: string }> = ({ worktreePath }) => {
  const [status, setStatus] = useState<{
    modified: string[]
    staged: string[]
    untracked: string[]
    deleted: string[]
  }>({ modified: [], staged: [], untracked: [], deleted: [] })
  const [loading, setLoading] = useState(true)
  const [commitMsg, setCommitMsg] = useState('')
  const [committing, setCommitting] = useState(false)
  const [staging, setStaging] = useState(false)
  const [showCommitInput, setShowCommitInput] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(() => {
    if (!window.runnio?.git?.workingStatus) return
    window.runnio.git.workingStatus(worktreePath)
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [worktreePath])

  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, 5000)
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [fetchStatus])

  const handleStageAll = async () => {
    setStaging(true)
    const result = await window.runnio.git.stageAll(worktreePath)
    if (result.success) {
      useStore.getState().showToast('All files staged', 'success')
    } else {
      useStore.getState().showToast(result.error || 'Stage failed', 'warning')
    }
    setStaging(false)
    fetchStatus()
  }

  const handleCommit = async () => {
    if (!commitMsg.trim()) return
    setCommitting(true)
    const result = await window.runnio.git.commitChanges(worktreePath, commitMsg.trim())
    if (result.success) {
      useStore.getState().showToast('Committed successfully', 'success')
      setCommitMsg('')
      setShowCommitInput(false)
    } else {
      useStore.getState().showToast(result.error || 'Commit failed', 'warning')
    }
    setCommitting(false)
    fetchStatus()
  }

  const allFiles = [
    ...status.modified.map(f => ({ path: f, badge: 'M', color: 'var(--waiting)' })),
    ...status.untracked.map(f => ({ path: f, badge: '?', color: 'var(--text-tertiary)' })),
    ...status.deleted.map(f => ({ path: f, badge: 'D', color: 'var(--error)' })),
  ]

  const stagedFiles = status.staged.map(f => ({ path: f, badge: 'S', color: 'var(--working)' }))

  if (loading) {
    return React.createElement('div', {
      style: { padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' },
    }, 'Loading status...')
  }

  const totalChanges = allFiles.length + stagedFiles.length

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' },
  },
    // Summary bar
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)',
      },
    },
      React.createElement('span', {
        style: { fontSize: '11px', color: 'var(--text-secondary)' },
      }, totalChanges === 0 ? 'Working tree clean' : `${allFiles.length} changed, ${stagedFiles.length} staged`),
      React.createElement('button', {
        onClick: fetchStatus,
        style: {
          background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer',
          padding: '2px', display: 'flex', alignItems: 'center',
        },
      }, React.createElement(RefreshCw, { size: 12 })),
    ),
    // File list
    React.createElement('div', {
      style: { flex: 1, overflowY: 'auto' as const, padding: '4px 0' },
    },
      // Staged section
      stagedFiles.length > 0
        ? React.createElement(React.Fragment, null,
            React.createElement('div', {
              style: { padding: '4px 12px', fontSize: '10px', color: 'var(--working)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
            }, 'Staged'),
            ...stagedFiles.map(f =>
              React.createElement('div', {
                key: 'staged-' + f.path,
                style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 12px' },
              },
                React.createElement('span', {
                  style: { fontSize: '10px', fontWeight: 600, color: f.color, width: '12px', textAlign: 'center' as const },
                }, f.badge),
                React.createElement('span', {
                  style: { fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Consolas, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
                }, f.path),
              )
            ),
          )
        : null,
      // Changed section
      allFiles.length > 0
        ? React.createElement(React.Fragment, null,
            React.createElement('div', {
              style: { padding: '4px 12px', fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: stagedFiles.length > 0 ? '8px' : '0' },
            }, 'Changes'),
            ...allFiles.map(f =>
              React.createElement('div', {
                key: 'change-' + f.path,
                style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 12px' },
              },
                React.createElement('span', {
                  style: { fontSize: '10px', fontWeight: 600, color: f.color, width: '12px', textAlign: 'center' as const },
                }, f.badge),
                React.createElement('span', {
                  style: { fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'Consolas, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
                }, f.path),
              )
            ),
          )
        : null,
      totalChanges === 0
        ? React.createElement('div', {
            style: { padding: '40px 20px', textAlign: 'center' as const, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' },
          },
            React.createElement(Check, { size: 20, color: 'var(--working)' }),
            React.createElement('div', { style: { marginTop: '8px' } }, 'No changes'),
          )
        : null,
    ),
    // Actions bar
    totalChanges > 0
      ? React.createElement('div', {
          style: {
            padding: '10px 12px', borderTop: '1px solid var(--border-default)',
            display: 'flex', flexDirection: 'column' as const, gap: '8px',
          },
        },
          // Commit input
          showCommitInput
            ? React.createElement('div', {
                style: { display: 'flex', gap: '6px' },
              },
                React.createElement('input', {
                  value: commitMsg,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCommitMsg(e.target.value),
                  onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleCommit(); if (e.key === 'Escape') setShowCommitInput(false) },
                  placeholder: 'Commit message...',
                  autoFocus: true,
                  style: {
                    flex: 1, padding: '5px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-default)',
                    borderRadius: '4px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
                    fontFamily: 'inherit',
                  },
                }),
                React.createElement('button', {
                  onClick: handleCommit,
                  disabled: committing || !commitMsg.trim(),
                  style: {
                    padding: '5px 10px', background: 'var(--accent)', border: 'none',
                    borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: committing ? 'wait' : 'pointer',
                    opacity: committing || !commitMsg.trim() ? 0.5 : 1,
                  },
                }, committing ? '...' : 'Commit'),
                React.createElement('button', {
                  onClick: () => setShowCommitInput(false),
                  style: {
                    padding: '5px', background: 'transparent', border: '1px solid var(--border-default)',
                    borderRadius: '4px', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  },
                }, React.createElement(X, { size: 12 })),
              )
            : null,
          // Buttons
          React.createElement('div', {
            style: { display: 'flex', gap: '6px' },
          },
            React.createElement('button', {
              onClick: handleStageAll,
              disabled: staging || allFiles.length === 0,
              style: {
                flex: 1, padding: '6px', background: 'transparent', border: '1px solid var(--border-default)',
                borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '11px', cursor: staging ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                opacity: allFiles.length === 0 ? 0.5 : 1,
              },
            }, React.createElement(Plus, { size: 11 }), staging ? 'Staging...' : 'Stage All'),
            React.createElement('button', {
              onClick: () => setShowCommitInput(true),
              disabled: stagedFiles.length === 0 && allFiles.length === 0,
              style: {
                flex: 1, padding: '6px', background: 'var(--accent)', border: 'none',
                borderRadius: '4px', color: '#fff', fontSize: '11px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                opacity: stagedFiles.length === 0 && allFiles.length === 0 ? 0.5 : 1,
              },
            }, React.createElement(GitBranch, { size: 11 }), 'Commit'),
          ),
        )
      : null,
  )
}

// ── Tab config ──
const TABS: { id: RightPanelTab; label: string; Icon: React.FC<{ size: number }> }[] = [
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'diff', label: 'Diff', Icon: GitCompareArrows },
  { id: 'pr', label: 'PR', Icon: GitPullRequest },
  { id: 'notes', label: 'Notes', Icon: StickyNote },
  { id: 'changes', label: 'Changes', Icon: GitBranch },
]

// ── Main RightPanel ──
const RightPanel: React.FC<Props> = ({ worktreePath, branch, rootPath }) => {
  const isOpen = useStore(s => s.isRightPanelOpen)
  const activeTab = useStore(s => s.rightPanelTab)

  const tabStyle = (tab: RightPanelTab): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '5px 10px', background: 'transparent', border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontSize: '11px', cursor: 'pointer', transition: 'all 100ms',
    whiteSpace: 'nowrap' as const,
  })

  return React.createElement('div', {
    style: {
      width: isOpen ? PANEL_WIDTH + 'px' : '0px',
      minWidth: isOpen ? PANEL_WIDTH + 'px' : '0px',
      borderLeft: isOpen ? '1px solid var(--border-default)' : 'none',
      display: 'flex', flexDirection: 'column' as const,
      overflow: 'hidden', flexShrink: 0,
      transition: 'width 200ms ease-out, min-width 200ms ease-out',
    },
  },
    // Tab bar
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-default)',
        flexShrink: 0, overflowX: 'auto' as const,
      },
    },
      ...TABS.map(t =>
        React.createElement('button', {
          key: t.id,
          onClick: () => useStore.getState().toggleRightPanel(t.id),
          style: tabStyle(t.id),
        },
          React.createElement(t.Icon, { size: 12 }),
          t.label,
        )
      ),
      React.createElement('div', { style: { flex: 1 } }),
      React.createElement('button', {
        onClick: () => useStore.getState().toggleRightPanel(activeTab),
        title: 'Close panel',
        style: {
          background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer',
          padding: '4px 8px', display: 'flex', alignItems: 'center', transition: 'color 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-primary)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
      }, React.createElement(X, { size: 13 })),
    ),
    // Tab content
    React.createElement('div', {
      style: { flex: 1, overflow: 'hidden', position: 'relative' as const },
    },
      // Files
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'files' ? 'flex' : 'none' },
      }, React.createElement(FileTree, { worktreePath })),
      // Diff
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'diff' ? 'flex' : 'none', flexDirection: 'column' as const },
      }, React.createElement(DiffViewer, { worktreePath, visible: activeTab === 'diff' })),
      // PR
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'pr' ? 'block' : 'none', overflow: 'auto' as const },
      },
        React.createElement(UpgradeGate, { feature: 'prFlow' },
          React.createElement(PRPanel, { worktreePath, branch })
        ),
      ),
      // Notes
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'notes' ? 'block' : 'none' },
      },
        React.createElement(UpgradeGate, { feature: 'sessionNotes' },
          React.createElement(WorkspaceNotes, { branch, rootPath })
        ),
      ),
      // Changes
      React.createElement('div', {
        style: { position: 'absolute' as const, inset: 0, display: activeTab === 'changes' ? 'flex' : 'none', flexDirection: 'column' as const },
      }, React.createElement(ChangesView, { worktreePath })),
    ),
  )
}

export default RightPanel
