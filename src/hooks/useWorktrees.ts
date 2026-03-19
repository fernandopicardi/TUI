import { useState, useEffect, useRef } from 'react'
import { createGit, listWorktrees, Worktree } from '../utils/git.js'

export function useWorktrees(rootPath: string, refreshInterval = 3000) {
  const [worktrees, setWorktrees] = useState<Worktree[]>([])
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const git = createGit(rootPath)

    const refresh = async () => {
      try {
        const wts = await listWorktrees(git)
        setWorktrees(wts)
        setError(null)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      }
    }

    refresh()
    intervalRef.current = setInterval(refresh, refreshInterval)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [rootPath, refreshInterval])

  return { worktrees, error, rootPath }
}
