import execa from 'execa'
import { normalizePath } from '../utils/paths.js'
import { isClaudeInstalled } from '../utils/claude.js'

export interface OpenWorkspaceResult {
  success: boolean
  message: string
}

export async function openWorkspace(
  worktreePath: string,
  preferredTerminal?: 'wt' | 'cmd',
  openCommand = 'claude'
): Promise<OpenWorkspaceResult> {
  const normalizedPath = normalizePath(worktreePath)

  // Check if claude is installed when using default command
  if (openCommand === 'claude' && !(await isClaudeInstalled())) {
    return {
      success: false,
      message: 'Claude Code não encontrado. Instale com: npm install -g @anthropic-ai/claude-code',
    }
  }

  if (preferredTerminal === 'cmd') {
    return openWithCmd(normalizedPath, openCommand)
  }

  // Try Windows Terminal first
  if (preferredTerminal === 'wt' || !preferredTerminal) {
    try {
      await execa('wt', ['-d', normalizedPath, 'cmd', '/k', openCommand], {
        detached: true,
        windowsHide: false,
        cleanup: false,
      })
      return { success: true, message: `Abrindo no Windows Terminal...` }
    } catch {
      // wt not available, fall through to CMD silently
    }
  }

  // Fallback to CMD
  return openWithCmd(normalizedPath, openCommand)
}

async function openWithCmd(normalizedPath: string, openCommand: string): Promise<OpenWorkspaceResult> {
  try {
    await execa('cmd', ['/c', 'start', 'cmd', '/k', `cd /d "${normalizedPath}" && ${openCommand}`], {
      detached: true,
      windowsHide: false,
      cleanup: false,
    })
    return { success: true, message: 'Abrindo no CMD...' }
  } catch {
    return {
      success: false,
      message: `Não foi possível abrir terminal. Execute manualmente: cd /d "${normalizedPath}" && ${openCommand}`,
    }
  }
}
