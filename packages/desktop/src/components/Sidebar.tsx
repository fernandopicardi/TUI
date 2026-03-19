import * as React from 'react'
import { WorktreeData, AgentStatusValue } from '../types'
import AgentStatusBadge from './AgentStatusBadge'

interface Props {
  worktrees: WorktreeData[]
  statuses: Record<string, AgentStatusValue>
  selectedId: string | null
  pluginName: string | null
  onSelect: (path: string) => void
  onNewWorktree: () => void
}

const Sidebar: React.FC<Props> = ({ worktrees, statuses, selectedId, pluginName, onSelect, onNewWorktree }) => {
  const pluginLabel = pluginName === 'agency-os' ? 'Agency OS'
    : pluginName === 'bmad' ? 'BMAD'
    : pluginName === 'generic' ? 'Project'
    : 'Workspaces'

  return React.createElement('aside', {
    style: {
      width: '220px', minWidth: '220px', backgroundColor: '#080808',
      borderRight: '1px solid #1a1a1a', display: 'flex',
      flexDirection: 'column' as const, height: '100%', overflow: 'hidden',
    },
  },
    // Plugin header
    React.createElement('div', {
      style: {
        padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: '8px',
      },
    },
      React.createElement('span', { style: { color: '#5b6af0', fontSize: '12px' } }, '\u25C6'),
      React.createElement('span', {
        style: { color: '#ededed', fontSize: '12px', fontWeight: 600 },
      }, pluginLabel),
    ),

    // Worktree list
    React.createElement('div', {
      style: {
        flex: 1, overflowY: 'auto' as const, padding: '0 8px',
        display: 'flex', flexDirection: 'column' as const, gap: '1px',
      },
    },
      ...worktrees.map((wt, i) => {
        const isSelected = wt.path === selectedId
        const isLast = i === worktrees.length - 1
        const status = (statuses[wt.path] || 'idle') as AgentStatusValue
        const prefix = isLast ? '\u2514' : '\u251C'

        return React.createElement('button', {
          key: wt.path,
          onClick: () => onSelect(wt.path),
          style: {
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 10px', background: isSelected ? '#161622' : 'transparent',
            border: 'none', borderLeft: isSelected ? '2px solid #5b6af0' : '2px solid transparent',
            borderRadius: '0 4px 4px 0', cursor: 'pointer',
            transition: 'all 0.1s', width: '100%', textAlign: 'left' as const,
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isSelected) (e.currentTarget).style.background = '#111'
          },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!isSelected) (e.currentTarget).style.background = 'transparent'
          },
        },
          React.createElement('span', { style: { color: '#333', fontSize: '11px', width: '12px', flexShrink: 0 } }, prefix),
          React.createElement('span', {
            style: {
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              color: isSelected ? '#ededed' : '#aaa', fontSize: '12px',
              fontFamily: 'Consolas, monospace',
            },
            title: wt.path,
          }, wt.branch || 'detached'),
          React.createElement(AgentStatusBadge, { status })
        )
      })
    ),

    // New workspace button
    React.createElement('div', { style: { padding: '8px' } },
      React.createElement('button', {
        onClick: onNewWorktree,
        style: {
          width: '100%', padding: '7px', backgroundColor: 'transparent',
          border: '1px dashed #222', borderRadius: '6px', color: '#555',
          fontSize: '12px', cursor: 'pointer', transition: 'all 150ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          (e.currentTarget).style.borderColor = '#5b6af0';
          (e.currentTarget).style.color = '#5b6af0'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          (e.currentTarget).style.borderColor = '#222';
          (e.currentTarget).style.color = '#555'
        },
      }, '+ novo workspace')
    ),

    // Footer
    React.createElement('div', {
      style: { padding: '8px 12px', borderTop: '1px solid #1a1a1a', fontSize: '10px', color: '#333' },
    }, 'agentflow v0.1.0')
  )
}

export default Sidebar
