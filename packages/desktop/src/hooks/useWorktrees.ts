import { useEffect, useCallback } from 'react'
import { store } from '../store/index'

/**
 * Initializes worktree watching via IPC when rootPath is set.
 */
export function useWorktreeWatcher(rootPath: string | null) {
  useEffect(() => {
    if (!rootPath) return

    // Initial load
    window.agentflow.git.listWorktrees(rootPath).then((wts) => {
      store.getState().setWorktrees(wts)
    })

    // Start watching
    const interval = store.getState().config?.refreshInterval ?? 3000
    window.agentflow.git.watchWorktrees(rootPath, interval)

    // Listen for changes
    const cleanup = window.agentflow.git.onWorktreesChanged((wts) => {
      store.getState().setWorktrees(wts)
    })

    return cleanup
  }, [rootPath])

  const refresh = useCallback(() => {
    if (!rootPath) return
    window.agentflow.git.listWorktrees(rootPath).then((wts) => {
      store.getState().setWorktrees(wts)
    })
  }, [rootPath])

  return { refresh }
}
