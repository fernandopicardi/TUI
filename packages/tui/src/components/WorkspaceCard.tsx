import * as React from 'react'
import { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { Worktree, AgentStatus, pathExists } from '@agentflow/core'
import AgentStatusBadge from './AgentStatusBadge.js'

interface Props {
  worktree: Worktree
  status: AgentStatus
  isSelected: boolean
  showTimestamp?: boolean
  lastModified?: number
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s atr\u00E1s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m atr\u00E1s`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atr\u00E1s`
  const days = Math.floor(hours / 24)
  return `${days}d atr\u00E1s`
}

const WorkspaceCard: React.FC<Props> = ({ worktree, status, isSelected, showTimestamp = true, lastModified }) => {
  const [now, setNow] = useState(Date.now())
  const [existsOnDisk, setExistsOnDisk] = useState(true)

  useEffect(() => {
    pathExists(worktree.path).then(setExistsOnDisk)
  }, [worktree.path])

  useEffect(() => {
    if (!showTimestamp || !lastModified) return
    const timer = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(timer)
  }, [showTimestamp, lastModified])

  const borderColor = isSelected ? 'white' : 'gray'
  const branchDisplay = worktree.branch || 'detached'

  if (!existsOnDisk) {
    return React.createElement(
      Box,
      { borderStyle: 'round', borderColor: 'red', paddingLeft: 1, paddingRight: 1, width: 52 },
      React.createElement(
        Box,
        null,
        React.createElement(Text, { color: 'red' }, '\u2717 '),
        React.createElement(Text, { strikethrough: true, dimColor: true }, branchDisplay),
        React.createElement(Text, { color: 'red' }, ' [removido]')
      )
    )
  }

  const elapsed = lastModified ? formatElapsed(now - lastModified) : null

  return React.createElement(
    Box,
    { borderStyle: 'round', borderColor, paddingLeft: 1, paddingRight: 1, width: 52 },
    React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(
        Box,
        null,
        React.createElement(Box, { marginRight: 1 }, React.createElement(AgentStatusBadge, { status })),
        React.createElement(Text, { bold: isSelected }, branchDisplay),
        worktree.isMain
          ? React.createElement(Text, { dimColor: true }, ' (main)')
          : null
      ),
      showTimestamp && elapsed
        ? React.createElement(Text, { dimColor: true }, `              modificado h\u00E1 ${elapsed}`)
        : null
    )
  )
}

export default WorkspaceCard
