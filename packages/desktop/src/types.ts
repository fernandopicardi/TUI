// ── Domain types ──

export interface AgentSession {
  id: string                    // unique: `${projectId}-${branch}`
  projectId: string
  branch: string
  worktreePath: string
  status: 'working' | 'waiting' | 'idle' | 'done'
  lastActivity?: number
  terminalId: string            // pty id in main process
  isTerminalAlive: boolean
  notes?: string
  tokenUsage?: { input: number; output: number; costUsd: number }
}

export interface Project {
  id: string                    // hash of rootPath
  name: string                  // repo folder name
  rootPath: string
  plugin: string                // 'raw' | 'generic' | 'agency-os' | 'bmad'
  pluginContext?: any
  agents: AgentSession[]
  addedAt: number
  lastOpenedAt: number
}

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning'
}

// ── IPC types ──

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

export interface AgentflowAPI {
  dialog: {
    openDirectory: () => Promise<string | null>
  }
  git: {
    listWorktrees: (rootPath: string) => Promise<WorktreeData[]>
    createWorktree: (rootPath: string, branch: string) => Promise<{ success: boolean; path?: string; error?: string }>
    removeWorktree: (rootPath: string, worktreePath: string) => Promise<void>
    watchWorktrees: (rootPath: string, interval: number) => Promise<boolean>
    onWorktreesChanged: (cb: (worktrees: WorktreeData[]) => void) => () => void
    getCurrentBranch: (rootPath: string) => Promise<string>
    clone: (url: string, targetPath: string, folderName: string) => Promise<{ success: boolean; path?: string; error?: string }>
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
    create: (id: string, worktreePath: string, command: string) => Promise<{ success: boolean; existed?: boolean; buffer?: string[]; simulated?: boolean; error?: string }>
    input: (id: string, data: string) => void
    resize: (id: string, cols: number, rows: number) => void
    onOutput: (cb: (id: string, data: string) => void) => () => void
    close: (id: string) => void
    getBuffer: (id: string) => Promise<string[]>
    isAlive: (id: string) => Promise<boolean>
  }
  github: {
    getDiff: (worktreePath: string) => Promise<{ files: string[]; diffs: Record<string, { original: string; modified: string }> }>
  }
  notify: (title: string, body: string, type: string) => void
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
}

declare global {
  interface Window {
    agentflow: AgentflowAPI
  }
}
