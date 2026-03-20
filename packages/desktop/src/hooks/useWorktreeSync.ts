import { useEffect } from 'react'
import { useStore } from '../store/index'

export function useWorktreeSync() {
  const projects = useStore(s => s.projects)

  useEffect(() => {
    if (!projects.length || !window.runnio?.git?.watchProjectWorktrees) return

    projects.forEach(p => {
      window.runnio.git.watchProjectWorktrees(p.id, p.rootPath)
    })

    const cleanup = window.runnio.git.onProjectWorktreesChanged((projectId, worktrees) => {
      const state = useStore.getState()
      const project = state.getProjectById(projectId)
      if (!project) return

      const existingPaths = new Set(project.agents.map(a => a.worktreePath))
      const worktreePaths = new Set(worktrees.map((w: any) => w.path))

      // Add agents for worktrees created outside the app
      worktrees.forEach((wt: any) => {
        if (!existingPaths.has(wt.path)) {
          const branch = wt.branch || 'unknown'
          const agentId = `${projectId}-${branch.replace(/\//g, '-')}-ext`
          state.addAgent(projectId, {
            id: agentId,
            projectId,
            branch,
            worktreePath: wt.path,
            status: 'idle',
            terminalId: agentId,
            isTerminalAlive: false,
            source: 'external',
          })
        }
      })

      // Remove agents whose worktree was deleted outside the app
      // (but don't remove the main branch agent whose path matches rootPath)
      project.agents.forEach(agent => {
        if (agent.worktreePath !== project.rootPath && !worktreePaths.has(agent.worktreePath)) {
          state.removeAgent(projectId, agent.id)
        }
      })
    })

    return () => {
      projects.forEach(p => window.runnio.git.unwatchProjectWorktrees(p.id))
      cleanup()
    }
  }, [projects.map(p => p.id).join(',')])
}
