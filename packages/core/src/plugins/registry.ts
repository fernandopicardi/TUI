import { RegentPlugin, PluginContext } from '../types/plugin'
import { RegentConfig } from '../types/config'
import { readJsonSafe, joinPath, withTimeout } from '../git/utils'
import agencyOSPlugin from './agency-os/index'
import bmadPlugin from './bmad/index'
import genericPlugin from './generic/index'
import rawPlugin from './raw/index'

const DETECT_TIMEOUT_MS = 2000
const LOAD_TIMEOUT_MS = 2000

const plugins: RegentPlugin[] = [
  agencyOSPlugin,
  bmadPlugin,
  genericPlugin,
  rawPlugin,
].sort((a, b) => b.priority - a.priority)

const pluginsByName = new Map<string, RegentPlugin>(
  plugins.map(p => [p.name, p])
)

/**
 * Resolve the best plugin for a given project root.
 * Checks config override first, then auto-detects by priority.
 * Each detect() has a 2-second timeout.
 */
export async function resolvePlugin(
  rootPath: string,
  config?: RegentConfig
): Promise<RegentPlugin> {
  // Check for manual override in config
  if (config?.plugin && pluginsByName.has(config.plugin)) {
    return pluginsByName.get(config.plugin)!
  }

  // Also check config file
  if (!config?.plugin) {
    const fileConfig = await readJsonSafe<{ plugin?: string }>(
      joinPath(rootPath, 'regent.config.json')
    )
    if (fileConfig?.plugin && pluginsByName.has(fileConfig.plugin)) {
      return pluginsByName.get(fileConfig.plugin)!
    }
  }

  // Auto-detect by priority, with timeout per plugin
  for (const plugin of plugins) {
    try {
      const detected = await withTimeout(
        plugin.detect(rootPath),
        DETECT_TIMEOUT_MS,
        `Plugin "${plugin.name}" detect`
      )
      if (detected) return plugin
    } catch {
      // Plugin detection failed or timed out, skip
    }
  }

  return rawPlugin
}

/**
 * Safely load a plugin's context. Falls back to raw plugin on failure.
 */
export async function loadPluginSafe(
  plugin: RegentPlugin,
  rootPath: string
): Promise<PluginContext | null> {
  try {
    return await withTimeout(
      plugin.load(rootPath),
      LOAD_TIMEOUT_MS,
      `Plugin "${plugin.name}" load`
    )
  } catch {
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

/**
 * Register a custom plugin at runtime.
 */
export function registerPlugin(plugin: RegentPlugin): void {
  plugins.push(plugin)
  plugins.sort((a, b) => b.priority - a.priority)
  pluginsByName.set(plugin.name, plugin)
}

export { plugins, rawPlugin }
