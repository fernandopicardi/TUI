import * as React from 'react'
import { Box, Text } from 'ink'
import { Worktree } from '../utils/git.js'
import { AgentStatus } from '../hooks/useAgentStatus.js'
import AgentStatusIndicator from './AgentStatus.js'

interface Props {
  worktree: Worktree
  status: AgentStatus
  isSelected: boolean
}

const WorkspaceCard: React.FC<Props> = ({ worktree, status, isSelected }) => {
  const borderColor = isSelected ? 'white' : 'gray'
  const branchDisplay = worktree.branch || 'detached'

  return React.createElement(
    Box,
    {
      borderStyle: 'round',
      borderColor,
      paddingLeft: 1,
      paddingRight: 1,
      width: 52,
    },
    React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(
        Box,
        null,
        React.createElement(
          Box,
          { marginRight: 1 },
          React.createElement(AgentStatusIndicator, { status })
        ),
        React.createElement(
          Text,
          { bold: isSelected },
          branchDisplay
        ),
        worktree.isMain
          ? React.createElement(Text, { dimColor: true }, ' (main)')
          : null
      )
    )
  )
}

export default WorkspaceCard
