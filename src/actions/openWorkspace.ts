import execa from 'execa'
import { normalizePath } from '../utils/paths.js'

export async function openWorkspace(
  worktreePath: string,
  preferredTerminal?: 'wt' | 'cmd'
): Promise<void> {
  const normalizedPath = normalizePath(worktreePath)

  if (preferredTerminal === 'cmd') {
    await openWithCmd(normalizedPath)
    return
  }

  // Try Windows Terminal first
  if (preferredTerminal === 'wt' || !preferredTerminal) {
    try {
      await execa('wt', ['-d', normalizedPath, 'cmd', '/k', 'claude'], {
        detached: true,
        windowsHide: false,
        cleanup: false,
      })
      return
    } catch {
      // Fall through to CMD
    }
  }

  // Fallback to CMD
  try {
    await openWithCmd(normalizedPath)
    return
  } catch {
    // All methods failed
    throw new Error(
      `Não foi possível abrir terminal. Execute manualmente:\n  cd /d "${normalizedPath}" && claude`
    )
  }
}

async function openWithCmd(normalizedPath: string): Promise<void> {
  await execa('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${normalizedPath}" && claude`], {
    detached: true,
    windowsHide: false,
    cleanup: false,
  })
}
