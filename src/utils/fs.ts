import * as fs from 'fs'
import { normalizePath } from './paths.js'

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(normalizePath(filePath))
    return true
  } catch {
    return false
  }
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(normalizePath(dirPath))
    return stat.isDirectory()
  } catch {
    return false
  }
}

export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(normalizePath(filePath), 'utf-8')
  } catch {
    return null
  }
}

export async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  const content = await readFileSafe(filePath)
  if (!content) return null
  try {
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

export async function listDirs(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(normalizePath(dirPath), { withFileTypes: true })
    return entries.filter(e => e.isDirectory()).map(e => e.name)
  } catch {
    return []
  }
}
