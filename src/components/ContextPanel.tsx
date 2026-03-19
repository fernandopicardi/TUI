import * as React from 'react'
import { Box, Text } from 'ink'
import { AgentflowPlugin, PluginContext } from '../plugins/types.js'

interface Props {
  plugin: AgentflowPlugin | null
  context: PluginContext | null
}

const ContextPanel: React.FC<Props> = ({ plugin, context }) => {
  if (!plugin || !context) return null

  return React.createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    React.createElement(plugin.Panel, { context }),
    React.createElement(Text, { dimColor: true }, '─'.repeat(50))
  )
}

export default ContextPanel
