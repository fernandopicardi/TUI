import { useEffect } from 'react'
import { useStore } from '../store/index'

/**
 * Polls agent status for all agents across all projects.
 * Reads refreshInterval from the store so Settings changes take effect immediately.
 */
export function useAgentStatusWatcher() {
  const allAgents = useStore(s => s.projects.flatMap(p => p.agents))
  const refreshInterval = useStore(s => s.refreshInterval)

  useEffect(() => {
    if (allAgents.length === 0) return

    const poll = async () => {
      for (const agent of allAgents) {
        try {
          const status = await window.runnio.agents.getStatus(agent.worktreePath)
          useStore.getState().updateAgent(agent.id, { status, lastActivity: Date.now() })
        } catch {
          // Ignore status poll errors
        }
      }
    }

    poll()
    const interval = setInterval(poll, refreshInterval)
    return () => clearInterval(interval)
  }, [allAgents.length, refreshInterval])
}
