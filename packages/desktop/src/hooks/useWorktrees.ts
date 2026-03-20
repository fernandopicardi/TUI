import { useCallback } from 'react'

/**
 * Lists git worktrees for a given root path.
 * Returns a refresh function.
 */
export function useWorktreeLoader(rootPath: string | null) {
  const refresh = useCallback(async () => {
    if (!rootPath || !window.runnio?.git) return []
    try {
      return await window.runnio.git.listWorktrees(rootPath)
    } catch {
      return []
    }
  }, [rootPath])

  return { refresh }
}
