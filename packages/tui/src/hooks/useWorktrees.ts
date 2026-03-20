import { useState, useEffect, useCallback, useRef } from 'react'
import { Worktree, watchWorktrees } from '@runnio/core'

export function useWorktrees(rootPath: string, refreshInterval = 3000) {
  const [worktrees, setWorktrees] = useState<Worktree[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const refresh = useCallback(() => {
    // Force a new watch cycle by cleaning up and restarting
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    setIsLoading(true)
    const cleanup = watchWorktrees(
      rootPath,
      (wts) => {
        setWorktrees(wts)
        setIsLoading(false)
        setError(null)
      },
      refreshInterval
    )
    cleanupRef.current = cleanup
  }, [rootPath, refreshInterval])

  useEffect(() => {
    try {
      const cleanup = watchWorktrees(
        rootPath,
        (wts) => {
          setWorktrees(wts)
          setIsLoading(false)
          setError(null)
        },
        refreshInterval
      )
      cleanupRef.current = cleanup

      return () => {
        if (cleanupRef.current) {
          cleanupRef.current()
          cleanupRef.current = null
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setIsLoading(false)
    }
  }, [rootPath, refreshInterval])

  return { worktrees, rootPath, isLoading, error, refresh }
}
