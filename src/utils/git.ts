import { simpleGit, SimpleGit } from 'simple-git'
import { normalizePath } from './paths.js'
import { pathExistsOnDisk } from './fs.js'

export interface Worktree {
  path: string
  branch: string
  head: string
  isMain: boolean
  existsOnDisk: boolean
  lastModified?: Date
}

export function createGit(basePath: string): SimpleGit {
  return simpleGit(normalizePath(basePath))
}

export async function listWorktrees(git: SimpleGit): Promise<Worktree[]> {
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

    const existsOnDisk = await pathExistsOnDisk(wtPath)
    worktrees.push({ path: wtPath, branch, head, isMain, existsOnDisk })
  }

  return worktrees
}

export async function addWorktree(
  git: SimpleGit,
  worktreePath: string,
  branchName: string
): Promise<void> {
  await git.raw(['worktree', 'add', '-b', branchName, normalizePath(worktreePath)])
}

export async function removeWorktree(
  git: SimpleGit,
  worktreePath: string
): Promise<void> {
  await git.raw(['worktree', 'remove', '--force', normalizePath(worktreePath)])
}

export async function getCurrentBranch(git: SimpleGit): Promise<string> {
  const branch = await git.revparse(['--abbrev-ref', 'HEAD'])
  return branch.trim()
}

export async function getRepoName(git: SimpleGit): Promise<string> {
  const toplevel = await git.revparse(['--show-toplevel'])
  const normalized = normalizePath(toplevel.trim())
  return normalized.split(/[\\/]/).pop() || 'unknown'
}
