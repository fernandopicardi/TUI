import * as React from 'react'
import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { Worktree } from '../utils/git.js'
import { AgentStatus } from '../hooks/useAgentStatus.js'
import AgentStatusIndicator from './AgentStatus.js'

interface Props {
  worktree: Worktree
  status: AgentStatus
  isSelected: boolean
  showTimestamp?: boolean
  lastModified?: number
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s atrás`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

const WorkspaceCard: React.FC<Props> = ({ worktree, status, isSelected, showTimestamp = true, lastModified }) => {
  const [now, setNow] = useState(Date.now())

  // Re-render timestamp every 5 seconds without full app re-render
  useEffect(() => {
    if (!showTimestamp || !lastModified) return
    const timer = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(timer)
  }, [showTimestamp, lastModified])

  const borderColor = isSelected ? 'white' : 'gray'
  const branchDisplay = worktree.branch || 'detached'

  if (!worktree.existsOnDisk) {
    return React.createElement(
      Box,
      {
        borderStyle: 'round',
        borderColor: 'red',
        paddingLeft: 1,
        paddingRight: 1,
        width: 52,
      },
      React.createElement(
        Box,
        null,
        React.createElement(Text, { color: 'red' }, '✗ '),
        React.createElement(Text, { strikethrough: true, dimColor: true }, branchDisplay),
        React.createElement(Text, { color: 'red' }, ' [removido]')
      )
    )
  }

  const elapsed = lastModified ? formatElapsed(now - lastModified) : null

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
      ),
      showTimestamp && elapsed
        ? React.createElement(
            Text,
            { dimColor: true },
            `              modificado há ${elapsed}`
          )
        : null
    )
  )
}

export default WorkspaceCard
