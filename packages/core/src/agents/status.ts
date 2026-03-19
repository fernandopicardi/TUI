import * as path from 'path'
import { Worktree } from '../types/worktree'
import { AgentStatus } from '../types/agent'
import { normalizePath } from '../git/utils'
import { getRunningNodeProcesses } from './process'

/**
 * Detect the agent status for a worktree.
 * Combines file modification time and process detection.
 *
 * - Modified < 15s ago → 'working'
 * - Modified 15-60s ago → 'waiting'
 * - Modified > 60s ago → 'idle'
 * - Node process with worktree path confirmed → reinforces 'working'
 */
export async function detectAgentStatus(
  worktree: Worktree,
  lastModifiedTime?: number
): Promise<AgentStatus> {
  const now = Date.now()

  // Check file modification time
  if (lastModifiedTime) {
    const elapsed = now - lastModifiedTime
    if (elapsed < 15_000) return 'working'
    if (elapsed < 60_000) return 'waiting'
  }

  // Try process detection as reinforcement
  try {
    const processes = await getRunningNodeProcesses()
    const normalizedWtPath = normalizePath(worktree.path).toLowerCase()
    const hasProcess = processes.some(cmd =>
      cmd.toLowerCase().includes(normalizedWtPath)
    )
    if (hasProcess) return 'working'
  } catch {
    // Process detection failed, rely on file modification time only
  }

  return 'idle'
}
