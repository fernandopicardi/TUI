import { AgentflowPlugin } from './types.js'
import { readJsonSafe } from '../utils/fs.js'
import { joinPath } from '../utils/paths.js'
import agencyOSPlugin from './agency-os/index.js'
import bmadPlugin from './bmad/index.js'
import genericPlugin from './generic/index.js'
import rawPlugin from './raw/index.js'

interface AgentflowConfig {
  plugin?: string
}

const plugins: AgentflowPlugin[] = [
  agencyOSPlugin,
  bmadPlugin,
  genericPlugin,
  rawPlugin,
].sort((a, b) => b.priority - a.priority)

const pluginsByName = new Map<string, AgentflowPlugin>(
  plugins.map(p => [p.name, p])
)

export async function resolvePlugin(rootPath: string): Promise<AgentflowPlugin> {
  // Check for manual override in config
  const config = await readJsonSafe<AgentflowConfig>(
    joinPath(rootPath, 'agentflow.config.json')
  )
  if (config?.plugin && pluginsByName.has(config.plugin)) {
    return pluginsByName.get(config.plugin)!
  }

  // Auto-detect by priority
  for (const plugin of plugins) {
    try {
      if (await plugin.detect(rootPath)) {
        return plugin
      }
    } catch {
      // Skip plugin if detection fails
    }
  }

  // Final fallback
  return rawPlugin
}

export { plugins }
