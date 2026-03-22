import { useEffect } from 'react'
import { useStore } from '../store/index'
import { TaskStatus } from '../types'

/**
 * Polls agent status for all agents across all projects.
 * Syncs agent status transitions to the task system automatically.
 */
export function useAgentStatusWatcher() {
  const allAgents = useStore(s => s.projects.flatMap(p => p.agents.filter(a => !a.archived)))
  const refreshInterval = useStore(s => s.refreshInterval)

  useEffect(() => {
    if (allAgents.length === 0) return

    const poll = async () => {
      const store = useStore.getState()
      for (const agent of allAgents) {
        try {
          const prevStatus = agent.status
          const status = await window.runnio.agents.getStatus(agent.worktreePath)
          store.updateAgent(agent.id, { status, lastActivity: Date.now() })

          // Sync task status based on agent transition
          if (status !== prevStatus) {
            syncAgentToTask(agent.id, agent.projectId, agent.branch, status, prevStatus)
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

/**
 * Syncs agent status transitions to the linked task.
 * Creates a task if none exists for this agent.
 */
function syncAgentToTask(
  agentId: string,
  projectId: string,
  branch: string,
  newStatus: string,
  prevStatus: string,
) {
  const store = useStore.getState()
  let task = store.getTaskForAgent(agentId)

  // Auto-create task if agent has none
  if (!task) {
    const taskId = `auto-${agentId}`
    const now = Date.now()
    store.addTask({
      id: taskId,
      title: branch,
      status: 'todo',
      source: 'runnio',
      projectId,
      agentId,
      createdAt: now,
      updatedAt: now,
      isAutomatic: true,
      activityLog: [{ action: 'Auto-created from agent', timestamp: now }],
    })
    task = store.getTaskForAgent(agentId)
    if (!task) return
  }

  // Map agent status to task status
  let taskStatus: TaskStatus | null = null
  if (newStatus === 'working' && task.status !== 'in-progress') {
    taskStatus = 'in-progress'
  } else if (newStatus === 'waiting' && task.status === 'in-progress') {
    taskStatus = 'ready-for-review'
  } else if (newStatus === 'done' && task.status !== 'done') {
    taskStatus = 'done'
  }

  if (taskStatus) {
    store.moveTask(task.id, taskStatus)
  }
}
