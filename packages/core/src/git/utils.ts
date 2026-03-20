import * as path from 'path'
import * as fs from 'fs'

/**
 * Normalize a path using Node's path.normalize — never hardcode separators.
 */
export function normalizePath(p: string): string {
  return path.normalize(p)
}

/**
 * Join path segments safely.
 */
export function joinPath(...segments: string[]): string {
  return path.join(...segments)
}

/**
 * Resolve path segments to absolute.
 */
export function resolvePath(...segments: string[]): string {
  return path.resolve(...segments)
}

/**
 * Get basename of a path.
 */
export function getBasename(p: string): string {
  return path.basename(normalizePath(p))
}

/**
 * Get dirname of a path.
 */
export function getDirname(p: string): string {
  return path.dirname(normalizePath(p))
}

/**
 * Get the git repo root by walking up directories.
 */
export async function getRepoRoot(cwd: string): Promise<string | null> {
  let current = path.resolve(cwd)
  while (true) {
    const gitDir = path.join(current, '.git')
    try {
      await fs.promises.access(gitDir)
      return current
    } catch {
      const parent = path.dirname(current)
      if (parent === current) return null
      current = parent
    }
  }
}

/**
 * Extract repo name from a root path.
 */
export function getRepoName(rootPath: string): string {
  return path.basename(normalizePath(rootPath)) || 'unknown'
}

/**
 * Check if a path exists on disk.
 */
export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.promises.access(normalizePath(p))
    return true
  } catch {
    return false
  }
}

/**
 * Check if a path is a directory.
 */
export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(normalizePath(dirPath))
    return stat.isDirectory()
  } catch {
    return false
  }
}

/**
 * Check if a file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(normalizePath(filePath))
    return stat.isFile()
  } catch {
    return false
  }
}

/**
 * Read a file safely, returning null on error.
 */
export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(normalizePath(filePath), 'utf-8')
  } catch {
    return null
  }
}

/**
 * Read and parse JSON safely, returning null on error.
 */
export async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  const content = await readFileSafe(filePath)
  if (!content) return null
  try {
    return JSON.parse(content) as T
  } catch {
    console.error(`[runnio] Warning: Invalid JSON in ${filePath}, using defaults`)
    return null
  }
}

/**
 * List subdirectory names in a directory.
 */
export async function listDirs(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(normalizePath(dirPath), { withFileTypes: true })
    return entries.filter((e: fs.Dirent) => e.isDirectory()).map((e: fs.Dirent) => e.name)
  } catch {
    return []
  }
}

/**
 * Split file content by lines, handling both \n and \r\n.
 */
export function splitLines(content: string): string[] {
  return content.split(/\r?\n/)
}

/**
 * Wrap a promise with a timeout. Rejects if the promise doesn't resolve within ms.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)

    promise.then(
      value => { clearTimeout(timer); resolve(value) },
      err => { clearTimeout(timer); reject(err) }
    )
  })
}
