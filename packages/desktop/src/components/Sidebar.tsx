import * as React from 'react'
import { WorktreeData, AgentStatusValue } from '../types'
import WorkspaceCard from './WorkspaceCard'

interface Props {
  worktrees: WorktreeData[]
  statuses: Record<string, AgentStatusValue>
  selectedId: string | null
  onSelect: (path: string) => void
  onNewWorktree: () => void
}

const Sidebar: React.FC<Props> = ({ worktrees, statuses, selectedId, onSelect, onNewWorktree }) => {
  return React.createElement('aside', {
    style: {
      width: '220px',
      minWidth: '220px',
      backgroundColor: '#0a0a0a',
      borderRight: '1px solid #1f1f1f',
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      overflow: 'hidden',
    },
  },
    // Header
    React.createElement('div', {
      style: {
        padding: '12px 16px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#888',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
      },
    }, 'Workspaces'),

    // List
    React.createElement('div', {
      style: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '0 8px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
      },
    },
      ...worktrees.map((wt) =>
        React.createElement(WorkspaceCard, {
          key: wt.path,
          worktree: wt,
          status: (statuses[wt.path] || 'idle') as AgentStatusValue,
          isSelected: wt.path === selectedId,
          onClick: () => onSelect(wt.path),
        })
      )
    ),

    // New worktree button
    React.createElement('div', {
      style: { padding: '8px' },
    },
      React.createElement('button', {
        onClick: onNewWorktree,
        style: {
          width: '100%',
          padding: '8px',
          backgroundColor: 'transparent',
          border: '1px dashed #333',
          borderRadius: '6px',
          color: '#888',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 150ms ease',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#5b6af0';
          (e.currentTarget as HTMLButtonElement).style.color = '#5b6af0'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#333';
          (e.currentTarget as HTMLButtonElement).style.color = '#888'
        },
      }, '+ novo workspace')
    )
  )
}

export default Sidebar
