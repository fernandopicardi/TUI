// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

// ── Task types ──

export interface GitHubIssue {
  id: string
  title: string
  state: string
  labels: string[]
  url: string
  source: 'github'
}

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
  source?: 'internal' | 'external'
  prUrl?: string
  prNumber?: number
  providerId?: string            // defaults to 'claude' if not set
  hasLaunched: boolean          // false = show config panel, true = show terminal
  launchConfig?: {
    model: string
    mode: 'normal' | 'plan' | 'auto'
    initialPrompt?: string
  }
  archived?: boolean
  archivedAt?: number
  detectedUrl?: string
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
  githubToken?: string
}

export type AgentStatusValue = 'working' | 'waiting' | 'idle' | 'done'

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  gitStatus?: 'M' | 'A' | 'D' | '?' | ''
  children?: FileEntry[]
}

export interface GitCommitData {
  hash: string
  hashShort: string
  message: string
  body: string
  author: string
  authorEmail: string
  date: string
  refs: string[]
  parents: string[]
}

export interface MCPServerEntry {
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  scope: 'global' | 'project'
}

export interface RunnioAPI {
  dialog: {
    openDirectory: () => Promise<{ path: string | null; error: string | null } | string | null>
  }
  git: {
    listWorktrees: (rootPath: string) => Promise<WorktreeData[]>
    createWorktree: (rootPath: string, branch: string) => Promise<{ success: boolean; path?: string; error?: string }>
    removeWorktree: (rootPath: string, worktreePath: string, deleteBranch?: boolean) => Promise<{ success: boolean; error?: string }>
    watchWorktrees: (rootPath: string, interval: number) => Promise<boolean>
    onWorktreesChanged: (cb: (worktrees: WorktreeData[]) => void) => () => void
    getCurrentBranch: (rootPath: string) => Promise<string>
    clone: (url: string, targetPath: string, folderName: string) => Promise<{ success: boolean; path?: string; error?: string }>
    log: (worktreePath: string, options?: { maxCount?: number }) => Promise<{ commits: GitCommitData[]; branches: string[]; currentBranch: string; error: string | null }>
    commitFiles: (worktreePath: string, hash: string) => Promise<{ status: string; path: string }[]>
    getAvatar: (email: string) => Promise<{ url: string | null; source: string }>
    checkout: (worktreePath: string, ref: string) => Promise<{ success: boolean; error?: string }>
    watchProjectWorktrees: (projectId: string, rootPath: string) => Promise<{ success: boolean }>
    unwatchProjectWorktrees: (projectId: string) => void
    onProjectWorktreesChanged: (cb: (projectId: string, worktrees: WorktreeData[]) => void) => () => void
    workingStatus: (worktreePath: string) => Promise<{ modified: string[]; staged: string[]; untracked: string[]; deleted: string[] }>
    stageAll: (worktreePath: string) => Promise<{ success: boolean; error?: string }>
    commitChanges: (worktreePath: string, message: string) => Promise<{ success: boolean; error?: string }>
  }
  agents: {
    getStatus: (worktreePath: string) => Promise<AgentStatusValue>
    detectAll: () => Promise<Record<string, boolean>>
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
    injectWhenReady: (id: string, prompt: string) => Promise<{ success: boolean; immediate?: boolean; queued?: boolean }>
    createGlobal: (config: { workingDir: string; terminalId: string; command: string }) => Promise<{ success: boolean; existed?: boolean; buffer?: string[]; error?: string }>
  }
  files: {
    list: (rootPath: string) => Promise<FileEntry[]>
    read: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string; binary?: boolean }>
  }
  github: {
    getDiff: (worktreePath: string) => Promise<{ files: string[]; diffs: Record<string, { original: string; modified: string }> }>
    createPR: (data: { worktreePath: string; title: string; description: string; baseBranch: string; branch: string }) => Promise<{ success: boolean; url?: string; number?: number; error?: string }>
    listIssues: (rootPath: string) => Promise<{ success: boolean; issues: GitHubIssue[] }>
  }
  mcp: {
    getConfig: (rootPath: string) => Promise<MCPServerEntry[]>
    addServer: (rootPath: string, server: { name: string; command: string; args?: string[]; env?: Record<string, string> }, scope: 'global' | 'project') => Promise<{ success: boolean; error?: string }>
    removeServer: (rootPath: string, name: string, scope: 'global' | 'project') => Promise<{ success: boolean; error?: string }>
  }
  settings: {
    readGlobal: () => Promise<Record<string, any>>
    writeGlobal: (data: Record<string, any>) => Promise<{ success: boolean }>
    readProject: (rootPath: string) => Promise<Record<string, any>>
    writeProject: (rootPath: string, data: Record<string, any>) => Promise<{ success: boolean }>
    testGithub: (token: string) => Promise<{ success: boolean; login?: string; avatar?: string }>
  }
  clipboard: {
    readText: () => string
    writeText: (text: string) => void
  }
  shell: {
    openPath: (fullPath: string) => Promise<string>
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
    runnio: RunnioAPI
  }
}
