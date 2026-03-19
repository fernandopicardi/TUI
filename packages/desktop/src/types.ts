export interface AgentflowAPI {
  dialog: {
    openDirectory: () => Promise<string | null>
  }
  git: {
    listWorktrees: (rootPath: string) => Promise<WorktreeData[]>
    createWorktree: (rootPath: string, branch: string) => Promise<WorktreeData>
    removeWorktree: (rootPath: string, worktreePath: string) => Promise<void>
    watchWorktrees: (rootPath: string, interval: number) => Promise<boolean>
    onWorktreesChanged: (cb: (worktrees: WorktreeData[]) => void) => () => void
    getCurrentBranch: (rootPath: string) => Promise<string>
  }
  agents: {
    getStatus: (worktreePath: string) => Promise<AgentStatusValue>
  }
  plugins: {
    load: (rootPath: string) => Promise<{ pluginName: string; context: PluginContextData | null }>
  }
  config: {
    load: (rootPath: string) => Promise<ConfigData>
  }
  terminal: {
    create: (id: string, worktreePath: string, command: string) => Promise<{ success: boolean; simulated?: boolean; error?: string }>
    input: (id: string, data: string) => void
    resize: (id: string, cols: number, rows: number) => void
    onOutput: (cb: (id: string, data: string) => void) => () => void
    close: (id: string) => void
  }
  github: {
    getDiff: (worktreePath: string) => Promise<{ files: string[]; diffs: Record<string, { original: string; modified: string }> }>
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
