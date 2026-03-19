import { useEffect, useRef } from 'react'
import { store } from '../store/index'
import { WorktreeData } from '../types'

/**
 * Polls agent status for each worktree via IPC.
 */
export function useAgentStatusWatcher(worktrees: WorktreeData[]) {
  const lastModifiedRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (worktrees.length === 0) return

    const poll = async () => {
      for (const wt of worktrees) {
        const lastMod = lastModifiedRef.current[wt.path]
        try {
          const status = await window.agentflow.agents.getStatus(wt, lastMod)
          store.getState().setAgentStatus(wt.path, status as any)
        } catch {
          // Ignore status poll errors
        }
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [worktrees.map(w => w.path).join('\0')])
}
