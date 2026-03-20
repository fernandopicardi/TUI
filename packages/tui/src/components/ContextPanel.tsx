import * as React from 'react'
import { Box, Text } from 'ink'
import { PluginContext } from '@regent/core'
import AgencyOSPanel from './AgencyOSPanel.js'
import BmadPanel from './BmadPanel.js'

interface Props {
  pluginName: string | null
  context: PluginContext | null
}

const ContextPanel: React.FC<Props> = ({ pluginName, context }) => {
  if (!context) return null

  let panel: React.ReactElement | null = null

  switch (pluginName) {
    case 'agency-os':
      panel = React.createElement(AgencyOSPanel, { context })
      break
    case 'bmad':
      panel = React.createElement(BmadPanel, { context })
      break
    case 'generic': {
      const data = context.data as { projectName: string; worktreeCount: number }
      panel = React.createElement(
        Text,
        { bold: true },
        `\u25C6 ${data.projectName} \u2014 ${data.worktreeCount} worktree(s)`
      )
      break
    }
    case 'raw': {
      const data = context.data as { repoName: string; branch: string; worktreeCount: number }
      panel = React.createElement(
        Text,
        { bold: true },
        `\u25C7 ${data.repoName} \u2014 ${data.branch} \u2014 ${data.worktreeCount} worktree(s)`
      )
      break
    }
    default:
      panel = React.createElement(Text, { dimColor: true }, context.summary)
  }

  return React.createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    panel,
    React.createElement(Text, { dimColor: true }, '\u2500'.repeat(50))
  )
}

export default ContextPanel
