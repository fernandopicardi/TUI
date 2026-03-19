import { AgentflowConfig, DEFAULT_CONFIG } from '../types/config'
import { joinPath, readJsonSafe } from '../git/utils'

/**
 * Load and validate agentflow.config.json from the project root.
 * Returns DEFAULT_CONFIG merged with any valid fields from the file.
 * Invalid JSON is logged and ignored.
 */
export async function loadConfig(rootPath: string): Promise<AgentflowConfig> {
  const configPath = joinPath(rootPath, 'agentflow.config.json')
  const loaded = await readJsonSafe<Partial<AgentflowConfig>>(configPath)

  if (!loaded) return { ...DEFAULT_CONFIG }

  return {
    ...DEFAULT_CONFIG,
    ...loaded,
  }
}
