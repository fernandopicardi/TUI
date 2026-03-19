// Types for the renderer process — mirrors the preload API
export interface AgentflowAPI {
  git: {
    listWorktrees: (rootPath: string) => Promise<WorktreeData[]>
    createWorktree: (rootPath: string, branch: string) => Promise<WorktreeData>
    removeWorktree: (rootPath: string, worktreePath: string) => Promise<void>
    watchWorktrees: (rootPath: string, interval: number) => Promise<boolean>
    onWorktreesChanged: (cb: (worktrees: WorktreeData[]) => void) => () => void
    getCurrentBranch: (rootPath: string) => Promise<string>
  }
  agents: {
    getStatus: (worktree: WorktreeData, lastModifiedTime?: number) => Promise<string>
  }
  plugins: {
    resolve: (rootPath: string) => Promise<{ name: string; priority: number }>
    load: (rootPath: string) => Promise<{ pluginName: string; context: PluginContextData | null }>
  }
  config: {
    load: (rootPath: string) => Promise<ConfigData>
  }
  dialog: {
    openDirectory: () => Promise<string | null>
  }
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
}

export interface WorktreeData {
  path: string
  branch: string
  head: string
  isMain: boolean
  lastModified?: string
}

export interface PluginContextData {
  pluginName: string
  summary: string
  data: Record<string, unknown>
}

export interface ConfigData {
  plugin?: string
  agencyPath?: string
  refreshInterval?: number
  terminal?: 'wt' | 'cmd' | 'auto'
  maxVisibleWorkspaces?: number
  showTimestamps?: boolean
  openCommand?: string
}

export type AgentStatusValue = 'working' | 'waiting' | 'idle' | 'done'

declare global {
  interface Window {
    agentflow: AgentflowAPI
  }
}
