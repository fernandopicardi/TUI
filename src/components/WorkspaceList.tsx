import * as React from 'react'
import { Box } from 'ink'
import { Worktree } from '../utils/git.js'
import { AgentStatus } from '../hooks/useAgentStatus.js'
import WorkspaceCard from './WorkspaceCard.js'

interface Props {
  worktrees: Worktree[]
  statuses: Record<string, AgentStatus>
  selectedIndex: number
}

const WorkspaceList: React.FC<Props> = ({ worktrees, statuses, selectedIndex }) => {
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    ...worktrees.map((wt, i) =>
      React.createElement(WorkspaceCard, {
        key: wt.path,
        worktree: wt,
        status: statuses[wt.path] || 'idle',
        isSelected: i === selectedIndex,
      })
    )
  )
}

export default WorkspaceList
