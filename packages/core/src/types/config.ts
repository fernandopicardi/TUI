export interface RunnioConfig {
  plugin?: string
  agencyPath?: string
  refreshInterval?: number
  terminal?: 'wt' | 'cmd' | 'auto'
  maxVisibleWorkspaces?: number
  showTimestamps?: boolean
  openCommand?: string
}

export const DEFAULT_CONFIG: RunnioConfig = {
  refreshInterval: 3000,
  terminal: 'auto',
  maxVisibleWorkspaces: 8,
  showTimestamps: true,
  openCommand: 'claude',
}
