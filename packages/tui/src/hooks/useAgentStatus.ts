import { useState, useEffect, useRef, useMemo } from 'react'
import * as chokidar from 'chokidar'
import * as path from 'path'
import { Worktree, AgentStatus, pathExists } from '@agentflow/core'

export function useAgentStatus(worktrees: Worktree[], refreshInterval = 2000) {
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({})
  const lastModifiedRef = useRef<Record<string, number>>({})
  const watchersRef = useRef<chokidar.FSWatcher[]>([])

  // Stable key to avoid re-running effect on every render
  const worktreeKey = useMemo(
    () => worktrees.map(w => w.path).join('\0'),
    [worktrees]
  )

  useEffect(() => {
    // Cleanup previous watchers
    const oldWatchers = watchersRef.current
    watchersRef.current = []
    for (const watcher of oldWatchers) {
      watcher.close()
    }

    for (const wt of worktrees) {
      const ignored = [
        path.join(wt.path, 'node_modules', '**'),
        path.join(wt.path, '.git', '**'),
        path.join(wt.path, 'dist', '**'),
      ]

      try {
        const watcher = chokidar.watch(wt.path, {
          ignored,
          ignoreInitial: true,
          depth: 3,
          persistent: true,
        })

        watcher.on('all', () => {
          lastModifiedRef.current[wt.path] = Date.now()
        })

        watcher.on('error', () => {
          // Silently ignore watch errors
        })

        watchersRef.current.push(watcher)
      } catch {
        // Skip worktrees that can't be watched
      }
    }

    // Status polling interval
    const interval = setInterval(() => {
      const now = Date.now()
      const newStatuses: Record<string, AgentStatus> = {}

      for (const wt of worktrees) {
        const lastMod = lastModifiedRef.current[wt.path]
        if (!lastMod) {
          newStatuses[wt.path] = 'idle'
        } else {
          const elapsed = now - lastMod
          if (elapsed < 15_000) {
            newStatuses[wt.path] = 'working'
          } else if (elapsed < 60_000) {
            newStatuses[wt.path] = 'waiting'
          } else {
            newStatuses[wt.path] = 'idle'
          }
        }
      }

      setStatuses(prev => {
        const prevKeys = Object.keys(prev).sort().join(',')
        const newKeys = Object.keys(newStatuses).sort().join(',')
        if (prevKeys === newKeys && Object.keys(newStatuses).every(k => prev[k] === newStatuses[k])) {
          return prev
        }
        return newStatuses
      })
    }, refreshInterval)

    return () => {
      clearInterval(interval)
      for (const watcher of watchersRef.current) {
        watcher.close()
      }
      watchersRef.current = []
    }
  }, [worktreeKey])

  return { statuses, lastModifiedMap: lastModifiedRef.current }
}
