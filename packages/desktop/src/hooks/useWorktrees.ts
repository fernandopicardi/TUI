import { useCallback } from 'react'

/**
 * Lists git worktrees for a given root path.
 * Returns a refresh function.
 */
export function useWorktreeLoader(rootPath: string | null) {
  const refresh = useCallback(async () => {
    if (!rootPath || !window.regent?.git) return []
    try {
      return await window.regent.git.listWorktrees(rootPath)
    } catch {
      return []
    }
  }, [rootPath])

  return { refresh }
}
