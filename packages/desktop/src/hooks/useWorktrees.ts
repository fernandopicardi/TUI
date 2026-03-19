import { useCallback } from 'react'

/**
 * Lists git worktrees for a given root path.
 * Returns a refresh function.
 */
export function useWorktreeLoader(rootPath: string | null) {
  const refresh = useCallback(async () => {
    if (!rootPath || !window.agentflow?.git) return []
    try {
      return await window.agentflow.git.listWorktrees(rootPath)
    } catch {
      return []
    }
  }, [rootPath])

  return { refresh }
}
