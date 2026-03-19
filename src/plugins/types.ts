import * as React from 'react'

export interface AgentflowPlugin {
  name: string
  priority: number
  detect(rootPath: string): Promise<boolean>
  load(rootPath: string): Promise<PluginContext>
  Panel: React.FC<{ context: PluginContext }>
}

export interface PluginContext {
  pluginName: string
  summary: string
  data: Record<string, unknown>
}
