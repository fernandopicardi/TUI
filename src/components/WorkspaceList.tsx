import * as React from 'react'
import { useMemo } from 'react'
import { Box, Text } from 'ink'
import { Worktree } from '../utils/git.js'
import { AgentStatus } from '../hooks/useAgentStatus.js'
import WorkspaceCard from './WorkspaceCard.js'

interface Props {
  worktrees: Worktree[]
  statuses: Record<string, AgentStatus>
  selectedIndex: number
  maxVisible?: number
  showTimestamps?: boolean
  lastModifiedMap?: Record<string, number>
}

const WorkspaceList: React.FC<Props> = ({
  worktrees,
  statuses,
  selectedIndex,
  maxVisible = 8,
  showTimestamps = true,
  lastModifiedMap = {},
}) => {
  // Calculate scroll window
  const { visibleWorktrees, startIndex, hiddenAbove, hiddenBelow } = useMemo(() => {
    if (worktrees.length <= maxVisible) {
      return { visibleWorktrees: worktrees, startIndex: 0, hiddenAbove: 0, hiddenBelow: 0 }
    }

    // Keep selected item visible with some padding
    let start = Math.max(0, selectedIndex - Math.floor(maxVisible / 2))
    const end = Math.min(worktrees.length, start + maxVisible)
    start = Math.max(0, end - maxVisible)

    return {
      visibleWorktrees: worktrees.slice(start, end),
      startIndex: start,
      hiddenAbove: start,
      hiddenBelow: worktrees.length - end,
    }
  }, [worktrees, selectedIndex, maxVisible])

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    hiddenAbove > 0
      ? React.createElement(
          Text,
          { dimColor: true },
          `  ↑ mais ${hiddenAbove} workspace(s)`
        )
      : null,
    ...visibleWorktrees.map((wt, i) => {
      const realIndex = startIndex + i
      return React.createElement(WorkspaceCard, {
        key: wt.path,
        worktree: wt,
        status: statuses[wt.path] || 'idle',
        isSelected: realIndex === selectedIndex,
        showTimestamp: showTimestamps,
        lastModified: lastModifiedMap[wt.path],
      })
    }),
    hiddenBelow > 0
      ? React.createElement(
          Text,
          { dimColor: true },
          `  ↓ mais ${hiddenBelow} workspace(s)`
        )
      : null
  )
}

export default WorkspaceList
