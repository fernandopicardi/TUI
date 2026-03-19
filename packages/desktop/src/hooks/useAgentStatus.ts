import { useEffect } from 'react'
import { useStore } from '../store/index'

/**
 * Polls agent status for all agents across all projects.
 */
export function useAgentStatusWatcher(refreshInterval = 2000) {
  const allAgents = useStore(s => s.projects.flatMap(p => p.agents))

  useEffect(() => {
    if (allAgents.length === 0) return

    const poll = async () => {
      for (const agent of allAgents) {
        try {
          const status = await window.agentflow.agents.getStatus(agent.worktreePath)
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
