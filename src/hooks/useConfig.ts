import { useState, useEffect } from 'react'
import { readJsonSafe } from '../utils/fs.js'
import { joinPath } from '../utils/paths.js'

export interface AgentflowConfig {
  plugin?: string
  agencyPath?: string
  refreshInterval?: number
  terminal?: 'wt' | 'cmd'
}

const DEFAULT_CONFIG: AgentflowConfig = {
  refreshInterval: 3000,
}

export function useConfig(rootPath: string) {
  const [config, setConfig] = useState<AgentflowConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    const load = async () => {
      const loaded = await readJsonSafe<AgentflowConfig>(
        joinPath(rootPath, 'agentflow.config.json')
      )
      setConfig({ ...DEFAULT_CONFIG, ...loaded })
    }
    load()
  }, [rootPath])

  return config
}
