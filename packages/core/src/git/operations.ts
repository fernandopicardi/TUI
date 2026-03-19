import * as path from 'path'
import * as fs from 'fs'
import { simpleGit } from 'simple-git'
import { Worktree } from '../types/worktree'
import { normalizePath, getDirname, pathExists } from './utils'
import { getRepoNameFromGit } from './worktrees'

/**
 * Create a new git worktree with a new branch.
 * The worktree is placed as a sibling directory to rootPath.
 */
export async function createWorktree(rootPath: string, branchName: string): Promise<Worktree> {
  const git = simpleGit(normalizePath(rootPath))
  const repoName = await getRepoNameFromGit(rootPath)
  const parentDir = getDirname(rootPath)
  const worktreePath = normalizePath(path.join(parentDir, `${repoName}-${branchName}`))

  await git.raw(['worktree', 'add', '-b', branchName, worktreePath])

  return {
    path: worktreePath,
    branch: branchName,
    head: '',
    isMain: false,
  }
}

/**
 * Remove a git worktree. Uses --force to handle uncommitted changes.
 */
export async function removeWorktree(rootPath: string, worktreePath: string): Promise<void> {
  const git = simpleGit(normalizePath(rootPath))
  const normalized = normalizePath(worktreePath)

  try {
    await git.raw(['worktree', 'remove', '--force', normalized])
  } catch (err: unknown) {
    // If worktree path no longer exists, just prune
    if (!(await pathExists(normalized))) {
      await git.raw(['worktree', 'prune'])
      return
    }
    throw err
  }
}

/**
 * Get the last modified time of a worktree by checking the most recent file.
 * Excludes .git, node_modules, dist directories.
 */
export async function getWorktreeLastModified(worktreePath: string): Promise<Date> {
  const normalized = normalizePath(worktreePath)
  const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.next', '.cache'])
  let latestMtime = new Date(0)

  async function scan(dir: string, depth: number): Promise<void> {
    if (depth > 3) return
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (ignoredDirs.has(entry.name)) continue
        const fullPath = path.join(dir, entry.name)
        try {
          const stat = await fs.promises.stat(fullPath)
          if (stat.mtime > latestMtime) {
            latestMtime = stat.mtime
          }
          if (entry.isDirectory()) {
            await scan(fullPath, depth + 1)
          }
        } catch {
          // Skip inaccessible files
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  await scan(normalized, 0)
  return latestMtime
}
