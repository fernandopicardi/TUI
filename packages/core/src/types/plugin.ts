export interface AgentflowPlugin {
  name: string
  priority: number
  detect(rootPath: string): Promise<boolean>
  load(rootPath: string): Promise<PluginContext>
}

export interface PluginContext {
  pluginName: string
  summary: string
  data: Record<string, unknown>
}
