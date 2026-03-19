import { useState, useEffect, useRef, useCallback } from 'react'
import { createGit, listWorktrees, Worktree } from '../utils/git.js'

export function useWorktrees(rootPath: string, refreshInterval = 3000) {
  const [worktrees, setWorktrees] = useState<Worktree[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevJsonRef = useRef<string>('')

  const refresh = useCallback(async () => {
    const git = createGit(rootPath)
    try {
      const wts = await listWorktrees(git)
      // Only update state if worktrees actually changed (prevents unnecessary re-renders)
      const json = JSON.stringify(wts.map(w => ({ p: w.path, b: w.branch, h: w.head, m: w.isMain, e: w.existsOnDisk })))
      if (json !== prevJsonRef.current) {
        prevJsonRef.current = json
        setWorktrees(wts)
      }
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [rootPath])

  useEffect(() => {
    setLoading(true)
    refresh()
    intervalRef.current = setInterval(refresh, refreshInterval)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [rootPath, refreshInterval, refresh])

  return { worktrees, loading, error, rootPath, refresh }
}
