import { app, BrowserWindow, Menu, ipcMain, dialog, Notification } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
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
import { simpleGit } from 'simple-git'

process.on('uncaughtException', (err) => {
  console.error('[agentflow] Uncaught exception:', err)
})
process.on('unhandledRejection', (err) => {
  console.error('[agentflow] Unhandled rejection:', err)
})

let mainWindow: BrowserWindow | null = null
const worktreeWatchers = new Map<string, () => void>()

// Terminal registry — survives navigation, persistent across renderer lifecycle
const terminalRegistry = new Map<string, {
  pty: any
  buffer: string[]
  isAlive: boolean
  simulated: boolean
}>()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'index.html'))
  registerIpcHandlers()

  const menu = Menu.buildFromTemplate([
    { label: 'File', submenu: [{ role: 'quit' }] },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

function registerIpcHandlers() {
  // ── Dialog ──
  ipcMain.handle('dialog:open-directory', async () => {
    try {
      if (!mainWindow) return null
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select project',
      })
      if (result.canceled || result.filePaths.length === 0) return null
      const dir = result.filePaths[0]
      console.log('[agentflow] Selected directory:', dir)
      const root = await getRepoRoot(dir)
      console.log('[agentflow] Git root:', root)
      if (!root) {
        console.log('[agentflow] Not a git repo')
        return null
      }
      return root
    } catch (err) {
      console.error('[agentflow] open-directory error:', err)
      return null
    }
  })

  // ── Git ──
  ipcMain.handle('git:list-worktrees', async (_e, rootPath: string) => {
    try {
      const result = await listWorktrees(normalizePath(rootPath))
      return JSON.parse(JSON.stringify(result))
    } catch (err) {
      console.error('[agentflow] list-worktrees error:', err)
      return []
    }
  })

  ipcMain.handle('git:create-worktree', async (_e, rootPath: string, branch: string) => {
    try {
      const result = await createWorktree(normalizePath(rootPath), branch)
      const data = JSON.parse(JSON.stringify(result))
      return { success: true, path: data.path, error: undefined }
    } catch (err: any) {
      console.error('[agentflow] create-worktree error:', err)
      return { success: false, path: undefined, error: err.message || String(err) }
    }
  })

  ipcMain.handle('git:remove-worktree', async (_e, rootPath: string, wtPath: string) => {
    try {
      await removeWorktree(normalizePath(rootPath), normalizePath(wtPath))
    } catch (err) {
      console.error('[agentflow] remove-worktree error:', err)
      throw err
    }
  })

  ipcMain.handle('git:get-current-branch', async (_e, rootPath: string) => {
    try {
      return await getCurrentBranch(normalizePath(rootPath))
    } catch (err) {
      console.error('[agentflow] get-current-branch error:', err)
      return 'unknown'
    }
  })

  ipcMain.handle('git:watch-worktrees', async (_e, rootPath: string, interval: number) => {
    try {
      const normalized = normalizePath(rootPath)
      if (worktreeWatchers.has(normalized)) {
        worktreeWatchers.get(normalized)!()
      }
      const cleanup = watchWorktrees(normalized, (wts) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('git:worktrees-changed', JSON.parse(JSON.stringify(wts)))
        }
      }, interval)
      worktreeWatchers.set(normalized, cleanup)
      return true
    } catch (err) {
      console.error('[agentflow] watch-worktrees error:', err)
      return false
    }
  })

  // ── Agent status ──
  ipcMain.handle('agent:get-status', async (_e, worktreePath: string) => {
    try {
      return await detectAgentStatus({ path: worktreePath, branch: '', head: '', isMain: false })
    } catch {
      return 'idle'
    }
  })

  // ── Plugins ──
  ipcMain.handle('plugin:load', async (_e, rootPath: string) => {
    try {
      const config = await loadConfig(normalizePath(rootPath))
      const plugin = await resolvePlugin(normalizePath(rootPath), config)
      const context = await loadPluginSafe(plugin, normalizePath(rootPath))
      return JSON.parse(JSON.stringify({ pluginName: plugin.name, context }))
    } catch (err) {
      console.error('[agentflow] plugin-load error:', err)
      return { pluginName: 'raw', context: null }
    }
  })

  // ── Config ──
  ipcMain.handle('config:load', async (_e, rootPath: string) => {
    try {
      return await loadConfig(normalizePath(rootPath))
    } catch {
      return {}
    }
  })

  // ── GitHub / Diff ──
  ipcMain.handle('github:get-diff', async (_e, worktreePath: string) => {
    try {
      const git = simpleGit(normalizePath(worktreePath))
      const status = await git.status()
      const files = [...status.modified, ...status.created, ...status.deleted]

      const diffs: Record<string, { original: string; modified: string }> = {}
      for (const file of files.slice(0, 20)) {
        try {
          const filePath = path.join(worktreePath, file)
          let modified = ''
          try { modified = await fs.promises.readFile(filePath, 'utf-8') } catch {}
          let original = ''
          try { original = await git.show([`HEAD:${file}`]) } catch {}
          diffs[file] = { original, modified }
        } catch { /* skip */ }
      }
      return { files, diffs }
    } catch {
      return { files: [], diffs: {} }
    }
  })

  // ── Terminal (persistent registry) ──
  let nodePty: any = null
  try {
    nodePty = require('node-pty')
  } catch {
    console.warn('[agentflow] node-pty not available — terminal in simulated mode')
  }

  ipcMain.handle('terminal:create', async (event, id: string, worktreePath: string, command: string) => {
    // If already exists and alive, return existing with buffer for replay
    if (terminalRegistry.has(id)) {
      const existing = terminalRegistry.get(id)!
      if (existing.isAlive) {
        return { success: true, existed: true, buffer: existing.buffer }
      }
      // Dead terminal — clean up and recreate
      terminalRegistry.delete(id)
    }

    if (!nodePty) {
      const entry = { pty: null, buffer: [] as string[], isAlive: true, simulated: true }
      terminalRegistry.set(id, entry)

      const simMsg = `\x1b[36m[agentflow]\x1b[0m Simulated terminal — node-pty not compiled\r\n`
      const dirMsg = `\x1b[36m[agentflow]\x1b[0m Directory: ${worktreePath}\r\n`
      entry.buffer.push(simMsg, dirMsg)

      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('terminal:output', id, simMsg)
          win.webContents.send('terminal:output', id, dirMsg)
        }
      })
      return { success: true, existed: false, simulated: true, buffer: [] }
    }

    try {
      const pty = nodePty.spawn('cmd.exe', [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: normalizePath(worktreePath),
        env: process.env,
        useConpty: true,
      })

      const entry = { pty, buffer: [] as string[], isAlive: true, simulated: false }
      terminalRegistry.set(id, entry)

      pty.onData((data: string) => {
        // Keep last 1000 chunks for replay on reconnect
        entry.buffer.push(data)
        if (entry.buffer.length > 1000) entry.buffer.shift()

        // Send to all renderer windows
        BrowserWindow.getAllWindows().forEach(win => {
          if (!win.isDestroyed()) {
            win.webContents.send('terminal:output', id, data)
          }
        })
      })

      pty.onExit(() => {
        entry.isAlive = false
      })

      // Auto-run command after small delay
      setTimeout(() => { pty.write(command + '\r') }, 300)

      return { success: true, existed: false, simulated: false, buffer: [] }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Replay buffer for reconnecting terminal
  ipcMain.handle('terminal:get-buffer', (_: any, id: string) => {
    return terminalRegistry.get(id)?.buffer ?? []
  })

  // Check if terminal is alive
  ipcMain.handle('terminal:is-alive', (_: any, id: string) => {
    const entry = terminalRegistry.get(id)
    return entry?.isAlive ?? false
  })

  ipcMain.on('terminal:input', (_e, id: string, data: string) => {
    const entry = terminalRegistry.get(id)
    if (entry && !entry.simulated && entry.pty) entry.pty.write(data)
  })

  ipcMain.on('terminal:resize', (_e, id: string, cols: number, rows: number) => {
    const entry = terminalRegistry.get(id)
    if (entry && !entry.simulated && entry.pty) entry.pty.resize(cols, rows)
  })

  // Explicit close — only called when agent is removed, NOT on component unmount
  ipcMain.on('terminal:close', (_e, id: string) => {
    const entry = terminalRegistry.get(id)
    if (entry) {
      if (!entry.simulated && entry.pty) entry.pty.kill()
      terminalRegistry.delete(id)
    }
  })

  // ── Clone ──
  ipcMain.handle('git:clone', async (_e, url: string, targetPath: string, folderName: string) => {
    try {
      const fullPath = path.join(normalizePath(targetPath), folderName)
      console.log('[agentflow] Cloning', url, 'to', fullPath)
      const git = simpleGit()
      await git.clone(url, fullPath)
      console.log('[agentflow] Clone complete:', fullPath)
      return { success: true, path: fullPath }
    } catch (err: any) {
      console.error('[agentflow] clone error:', err)
      return { success: false, error: err.message }
    }
  })

  // ── Notifications ──
  ipcMain.on('notify', (_e, title: string, body: string, type: string) => {
    try {
      if (!Notification.isSupported()) return
      new Notification({ title, body, silent: type === 'info' }).show()
    } catch (err) {
      console.error('[agentflow] notification error:', err)
    }
  })

  // ── Window controls ──
  ipcMain.on('window:minimize', () => { mainWindow?.minimize() })
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window:close', () => { mainWindow?.close() })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  for (const cleanup of worktreeWatchers.values()) cleanup()
  worktreeWatchers.clear()
  for (const entry of terminalRegistry.values()) {
    if (!entry.simulated && entry.pty) entry.pty.kill()
  }
  terminalRegistry.clear()
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
