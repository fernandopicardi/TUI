import { execFile } from 'child_process'
import { normalizePath } from '@runnio/core'

export interface OpenWorkspaceResult {
  success: boolean
  message: string
}

/**
 * Open a workspace in a new terminal window.
 * Tries in order: Windows Terminal → CMD → inline fallback message.
 */
export async function openInTerminal(
  worktreePath: string,
  command: string,
  preferredTerminal?: 'wt' | 'cmd' | 'auto'
): Promise<OpenWorkspaceResult> {
  const normalizedPath = normalizePath(worktreePath)

  if (preferredTerminal === 'cmd') {
    return openWithCmd(normalizedPath, command)
  }

  // Try Windows Terminal first
  if (preferredTerminal === 'wt' || preferredTerminal === 'auto' || !preferredTerminal) {
    try {
      await spawnDetached('wt', ['-d', normalizedPath, 'cmd', '/k', command])
      return { success: true, message: 'Abrindo no Windows Terminal...' }
    } catch {
      // wt not available, fall through to CMD silently
    }
  }

  return openWithCmd(normalizedPath, command)
}

async function openWithCmd(normalizedPath: string, command: string): Promise<OpenWorkspaceResult> {
  try {
    await spawnDetached('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${normalizedPath}" && ${command}`])
    return { success: true, message: 'Abrindo no CMD...' }
  } catch {
    return {
      success: false,
      message: `N\u00E3o foi poss\u00EDvel abrir terminal. Execute manualmente: cd /d "${normalizedPath}" && ${command}`,
    }
  }
}

function spawnDetached(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, { windowsHide: false }, (err) => {
      if (err) reject(err)
      else resolve()
    })
    child.unref()
    // Resolve quickly for detached processes — don't wait for full exit
    setTimeout(resolve, 500)
  })
}
