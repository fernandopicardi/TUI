import { simpleGit } from 'simple-git'
import { Worktree } from '../types/worktree'
import { normalizePath, pathExists } from './utils'

/**
 * List all worktrees for a git repository.
 * Uses `git worktree list --porcelain` via simple-git.
 */
export async function listWorktrees(rootPath: string): Promise<Worktree[]> {
  const git = simpleGit(normalizePath(rootPath))
  const raw = await git.raw(['worktree', 'list', '--porcelain'])
  const blocks = raw.trim().split(/\r?\n\r?\n/).filter(Boolean)

  const worktrees: Worktree[] = []

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx]
    const lines = block.split(/\r?\n/)
    let wtPath = ''
    let branch = ''
    let head = ''
    let isMain = false

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        wtPath = normalizePath(line.slice('worktree '.length))
      } else if (line.startsWith('HEAD ')) {
        head = line.slice('HEAD '.length)
      } else if (line.startsWith('branch ')) {
        const ref = line.slice('branch '.length)
        branch = ref.replace('refs/heads/', '')
      } else if (line === 'bare') {
        isMain = true
      }
    }

    // First worktree in the list is always the main one
    if (idx === 0) {
      isMain = true
    }

    worktrees.push({ path: wtPath, branch, head, isMain })
  }

  return worktrees
}

/**
 * Watch worktrees by polling at a configurable interval.
 * Calls onChange when the worktree list changes.
 * Returns a cleanup function.
 */
export function watchWorktrees(
  rootPath: string,
  onChange: (worktrees: Worktree[]) => void,
  interval: number
): () => void {
  let prevJson = ''
  let stopped = false

  const poll = async () => {
    if (stopped) return
    try {
      const wts = await listWorktrees(rootPath)
      const json = JSON.stringify(wts.map(w => ({ p: w.path, b: w.branch, h: w.head, m: w.isMain })))
      if (json !== prevJson) {
        prevJson = json
        onChange(wts)
      }
    } catch {
      // Silently ignore polling errors
    }
  }

  poll()
  const timer = setInterval(poll, interval)

  return () => {
    stopped = true
    clearInterval(timer)
  }
}

/**
 * Get the current branch name.
 */
export async function getCurrentBranch(rootPath: string): Promise<string> {
  const git = simpleGit(normalizePath(rootPath))
  const branch = await git.revparse(['--abbrev-ref', 'HEAD'])
  return branch.trim()
}

/**
 * Get the repo name from the root path (via git rev-parse).
 */
export async function getRepoNameFromGit(rootPath: string): Promise<string> {
  const git = simpleGit(normalizePath(rootPath))
  const toplevel = await git.revparse(['--show-toplevel'])
  const normalized = normalizePath(toplevel.trim())
  return normalized.split(/[\\/]/).pop() || 'unknown'
}
