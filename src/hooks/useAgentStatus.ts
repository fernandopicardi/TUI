import { useState, useEffect, useRef } from 'react'
import * as chokidar from 'chokidar'
import { Worktree } from '../utils/git.js'
import { joinPath } from '../utils/paths.js'

export type AgentStatus = 'working' | 'waiting' | 'idle' | 'done'

export function useAgentStatus(worktrees: Worktree[]) {
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({})
  const lastModifiedRef = useRef<Record<string, number>>({})
  const watchersRef = useRef<chokidar.FSWatcher[]>([])

  useEffect(() => {
    // Cleanup previous watchers
    for (const watcher of watchersRef.current) {
      watcher.close()
    }
    watchersRef.current = []

    for (const wt of worktrees) {
      const ignored = [
        joinPath(wt.path, 'node_modules', '**'),
        joinPath(wt.path, '.git', '**'),
        joinPath(wt.path, 'dist', '**'),
      ]

      const watcher = chokidar.watch(wt.path, {
        ignored,
        ignoreInitial: true,
        depth: 3,
        persistent: true,
      })

      watcher.on('all', () => {
        lastModifiedRef.current[wt.path] = Date.now()
      })

      watchersRef.current.push(watcher)
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

      setStatuses(newStatuses)
    }, 2000)

    return () => {
      clearInterval(interval)
      for (const watcher of watchersRef.current) {
        watcher.close()
      }
      watchersRef.current = []
    }
  }, [worktrees.map(w => w.path).join(',')])

  return statuses
}
