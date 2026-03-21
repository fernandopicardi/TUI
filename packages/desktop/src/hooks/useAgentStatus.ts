import { useEffect } from 'react'
import { useStore } from '../store/index'
import type { AgentSession, TaskStatus } from '../types'

type AgentStatus = AgentSession['status']

function syncAgentToTask(agent: AgentSession, newStatus: AgentStatus) {
  const store = useStore.getState()
  const existingTask = store.tasks.find(t => t.agentId === agent.id && t.isAutomatic)

  if (!existingTask) {
    if (newStatus === 'working') {
      store.addTask({
        title: agent.branch,
        status: 'in-progress',
        source: 'runnio',
        projectId: agent.projectId,
        agentId: agent.id,
        isAutomatic: true,
      })
    }
    return
  }

  const statusMap: Partial<Record<AgentStatus, TaskStatus>> = {
    working: 'in-progress',
    waiting: 'in-progress',
    idle: 'in-progress',
    done: 'ready-for-review',
  }

  const newTaskStatus = statusMap[newStatus]
  if (newTaskStatus && existingTask.status !== newTaskStatus) {
    store.moveTask(existingTask.id, newTaskStatus)
  }
}

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
          const status = await window.runnio.agents.getStatus(agent.worktreePath)
          const previousStatus = agent.status
          useStore.getState().updateAgent(agent.id, { status, lastActivity: Date.now() })
          if (status !== previousStatus) {
            syncAgentToTask(agent, status)
          }
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
