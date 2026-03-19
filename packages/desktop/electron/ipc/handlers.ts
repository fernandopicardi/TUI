import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as path from 'path'
import {
  listWorktrees,
  createWorktree,
  removeWorktree,
  watchWorktrees,
  getCurrentBranch,
  resolvePlugin,
  loadPluginSafe,
  loadConfig,
  detectAgentStatus,
  getRepoRoot,
  normalizePath,
} from '@agentflow/core'
import { IPC } from './channels'

const worktreeWatchers = new Map<string, () => void>()

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  // Git handlers
  ipcMain.handle(IPC.LIST_WORKTREES, async (_event, rootPath: string) => {
    return listWorktrees(normalizePath(rootPath))
  })

  ipcMain.handle(IPC.CREATE_WORKTREE, async (_event, rootPath: string, branch: string) => {
    return createWorktree(normalizePath(rootPath), branch)
  })

  ipcMain.handle(IPC.REMOVE_WORKTREE, async (_event, rootPath: string, worktreePath: string) => {
    await removeWorktree(normalizePath(rootPath), normalizePath(worktreePath))
  })

  ipcMain.handle(IPC.GET_CURRENT_BRANCH, async (_event, rootPath: string) => {
    return getCurrentBranch(normalizePath(rootPath))
  })

  ipcMain.handle(IPC.WATCH_WORKTREES, async (_event, rootPath: string, interval: number) => {
    const normalized = normalizePath(rootPath)
    // Clean up existing watcher for this root
    if (worktreeWatchers.has(normalized)) {
      worktreeWatchers.get(normalized)!()
      worktreeWatchers.delete(normalized)
    }

    const cleanup = watchWorktrees(normalized, (worktrees) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.WATCH_WORKTREES, worktrees)
      }
    }, interval)

    worktreeWatchers.set(normalized, cleanup)
    return true
  })

  // Agent status
  ipcMain.handle(IPC.GET_AGENT_STATUS, async (_event, worktree, lastModifiedTime?: number) => {
    return detectAgentStatus(worktree, lastModifiedTime)
  })

  // Plugins
  ipcMain.handle(IPC.RESOLVE_PLUGIN, async (_event, rootPath: string) => {
    const plugin = await resolvePlugin(normalizePath(rootPath))
    return { name: plugin.name, priority: plugin.priority }
  })

  ipcMain.handle(IPC.LOAD_PLUGIN, async (_event, rootPath: string) => {
    const plugin = await resolvePlugin(normalizePath(rootPath))
    const context = await loadPluginSafe(plugin, normalizePath(rootPath))
    return { pluginName: plugin.name, context }
  })

  // Config
  ipcMain.handle(IPC.LOAD_CONFIG, async (_event, rootPath: string) => {
    return loadConfig(normalizePath(rootPath))
  })

  // Dialog
  ipcMain.handle(IPC.OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Selecionar projeto',
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const dir = result.filePaths[0]
    const root = await getRepoRoot(dir)
    return root
  })

  // Window controls
  ipcMain.on(IPC.WINDOW_MINIMIZE, () => {
    mainWindow.minimize()
  })

  ipcMain.on(IPC.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on(IPC.WINDOW_CLOSE, () => {
    mainWindow.close()
  })
}

export function cleanupIpcHandlers() {
  for (const cleanup of worktreeWatchers.values()) {
    cleanup()
  }
  worktreeWatchers.clear()
}
