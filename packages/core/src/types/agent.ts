export type AgentStatus = 'working' | 'waiting' | 'idle' | 'done'

export interface AgentSession {
  worktreePath: string
  status: AgentStatus
  lastActivity?: Date
  pid?: number
}
