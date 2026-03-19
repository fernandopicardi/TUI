import * as React from 'react'
import { WorktreeData, AgentStatusValue } from '../types'
import AgentStatusBadge from './AgentStatusBadge'

interface Props {
  worktree: WorktreeData
  status: AgentStatusValue
  isSelected: boolean
  onClick: () => void
}

const WorkspaceCard: React.FC<Props> = ({ worktree, status, isSelected, onClick }) => {
  const borderColor = isSelected ? '#5b6af0' : '#1f1f1f'

  return React.createElement('div', {
    onClick,
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      padding: '12px 16px',
      backgroundColor: isSelected ? '#1a1a1a' : '#111',
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 150ms ease',
    },
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#151515'
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#111'
    },
  },
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    },
      React.createElement(AgentStatusBadge, { status }),
      worktree.isMain
        ? React.createElement('span', {
            style: { fontSize: '10px', color: '#555', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
          }, 'main')
        : null
    ),
    React.createElement('div', {
      style: {
        fontSize: '13px',
        fontWeight: isSelected ? 600 : 400,
        color: '#ededed',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      },
      title: worktree.path,
    }, worktree.branch || 'detached'),
  )
}

export default WorkspaceCard
