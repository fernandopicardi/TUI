import * as path from 'path'

export function normalizePath(p: string): string {
  return path.normalize(p)
}

export function joinPath(...segments: string[]): string {
  return path.join(...segments)
}

export function resolvePath(...segments: string[]): string {
  return path.resolve(...segments)
}

export function getBasename(p: string): string {
  return path.basename(normalizePath(p))
}

export function getDirname(p: string): string {
  return path.dirname(normalizePath(p))
}
