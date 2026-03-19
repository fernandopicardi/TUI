import { useEffect, useCallback } from 'react'
import { store } from '../store/index'

/**
 * Initializes worktree watching via IPC when rootPath is set.
 */
export function useWorktreeWatcher(rootPath: string | null) {
  useEffect(() => {
    if (!rootPath || !window.agentflow?.git) return

    // Initial load with error handling
    window.agentflow.git.listWorktrees(rootPath)
      .then((wts) => {
        store.getState().setWorktrees(wts)
      })
      .catch((err: unknown) => {
        console.error('[agentflow] listWorktrees failed:', err)
        store.getState().setError(
          'Falha ao listar worktrees: ' + (err instanceof Error ? err.message : String(err))
        )
      })

    // Start watching
    const interval = store.getState().config?.refreshInterval ?? 3000
    window.agentflow.git.watchWorktrees(rootPath, interval).catch((err: unknown) => {
      console.error('[agentflow] watchWorktrees failed:', err)
    })

    // Listen for changes
    const cleanup = window.agentflow.git.onWorktreesChanged((wts) => {
      store.getState().setWorktrees(wts)
    })

    return cleanup
  }, [rootPath])

  const refresh = useCallback(() => {
    if (!rootPath || !window.agentflow?.git) return
    window.agentflow.git.listWorktrees(rootPath)
      .then((wts) => store.getState().setWorktrees(wts))
      .catch(() => {})
  }, [rootPath])

  return { refresh }
}
