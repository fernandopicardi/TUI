import { AgentflowPlugin, PluginContext } from './types.js'
import { readJsonSafe } from '../utils/fs.js'
import { joinPath } from '../utils/paths.js'
import { withTimeout } from '../utils/timeout.js'
import agencyOSPlugin from './agency-os/index.js'
import bmadPlugin from './bmad/index.js'
import genericPlugin from './generic/index.js'
import rawPlugin from './raw/index.js'

const DETECT_TIMEOUT_MS = 2000
const LOAD_TIMEOUT_MS = 2000

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

  // Auto-detect by priority, with timeout per plugin
  for (const plugin of plugins) {
    try {
      const detected = await withTimeout(
        plugin.detect(rootPath),
        DETECT_TIMEOUT_MS,
        `Plugin "${plugin.name}" detect`
      )
      if (detected) {
        return plugin
      }
    } catch {
      // Plugin detection failed or timed out, skip
    }
  }

  // Final fallback
  return rawPlugin
}

export async function loadPluginSafe(
  plugin: AgentflowPlugin,
  rootPath: string
): Promise<PluginContext | null> {
  try {
    return await withTimeout(
      plugin.load(rootPath),
      LOAD_TIMEOUT_MS,
      `Plugin "${plugin.name}" load`
    )
  } catch {
    // If load fails, try raw plugin as fallback
    if (plugin.name !== 'raw') {
      try {
        return await rawPlugin.load(rootPath)
      } catch {
        return null
      }
    }
    return null
  }
}

export { plugins, rawPlugin }
