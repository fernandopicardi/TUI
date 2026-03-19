import { useState, useEffect } from 'react'
import { readJsonSafe } from '../utils/fs.js'
import { joinPath } from '../utils/paths.js'

export interface AgentflowConfig {
  plugin?: string
  agencyPath?: string
  refreshInterval?: number
  terminal?: 'wt' | 'cmd'
  maxVisibleWorkspaces?: number
  showTimestamps?: boolean
  openCommand?: string
}

const DEFAULT_CONFIG: Required<Omit<AgentflowConfig, 'plugin' | 'agencyPath'>> & Pick<AgentflowConfig, 'plugin' | 'agencyPath'> = {
  refreshInterval: 3000,
  terminal: undefined as unknown as 'wt' | 'cmd',
  maxVisibleWorkspaces: 8,
  showTimestamps: true,
  openCommand: 'claude',
}

export function useConfig(rootPath: string) {
  const [config, setConfig] = useState<AgentflowConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    const load = async () => {
      const loaded = await readJsonSafe<AgentflowConfig>(
        joinPath(rootPath, 'agentflow.config.json')
      )
      if (loaded) {
        setConfig({ ...DEFAULT_CONFIG, ...loaded })
      }
    }
    load()
  }, [rootPath])

  return config
}
