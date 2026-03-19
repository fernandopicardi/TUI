import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
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

// Prevent crashes from unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('[agentflow] Uncaught exception:', err)
})
process.on('unhandledRejection', (err) => {
  console.error('[agentflow] Unhandled rejection:', err)
})

let mainWindow: BrowserWindow | null = null
const worktreeWatchers = new Map<string, () => void>()
const terminals = new Map<string, { kill: () => void; write: (data: string) => void; resize: (cols: number, rows: number) => void; simulated: boolean }>()

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

  // Load the renderer HTML — src/index.html is two dirs up from dist/electron/
  mainWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'index.html'))

  registerIpcHandlers()

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [{ role: 'quit' }],
    },
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

  // Open devtools in dev mode for debugging
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
        title: 'Selecionar projeto',
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
      console.log('[agentflow] listWorktrees called with:', rootPath)
      const result = await listWorktrees(normalizePath(rootPath))
      console.log('[agentflow] listWorktrees returned:', result.length, 'worktrees')
      // Force clean serialization — no circular refs or non-serializable values
      return JSON.parse(JSON.stringify(result))
    } catch (err) {
      console.error('[agentflow] list-worktrees error:', err)
      return []
    }
  })

  ipcMain.handle('git:create-worktree', async (_e, rootPath: string, branch: string) => {
    try {
      const result = await createWorktree(normalizePath(rootPath), branch)
      return JSON.parse(JSON.stringify(result))
    } catch (err) {
      console.error('[agentflow] create-worktree error:', err)
      throw err
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

  // ── Terminal ──
  let nodePty: any = null
  try {
    nodePty = require('node-pty')
  } catch {
    console.warn('[agentflow] node-pty not available — terminal in simulated mode')
  }

  ipcMain.handle('terminal:create', async (event, id: string, worktreePath: string, command: string) => {
    // Kill existing terminal with same id
    if (terminals.has(id)) {
      const old = terminals.get(id)!
      if (!old.simulated) old.kill()
      terminals.delete(id)
    }

    if (!nodePty) {
      terminals.set(id, {
        simulated: true,
        kill: () => {},
        write: () => {},
        resize: () => {},
      })
      event.sender.send('terminal:output', id, `\x1b[36m[agentflow]\x1b[0m Terminal simulado — node-pty não compilado\r\n`)
      event.sender.send('terminal:output', id, `\x1b[36m[agentflow]\x1b[0m Diretório: ${worktreePath}\r\n`)
      event.sender.send('terminal:output', id, `\x1b[36m[agentflow]\x1b[0m Instale node-pty para terminal real\r\n`)
      return { success: true, simulated: true }
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

      pty.onData((data: string) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('terminal:output', id, data)
        }
      })

      terminals.set(id, {
        simulated: false,
        kill: () => pty.kill(),
        write: (data: string) => pty.write(data),
        resize: (cols: number, rows: number) => pty.resize(cols, rows),
      })

      // Auto-run command after small delay
      setTimeout(() => { pty.write(command + '\r') }, 300)

      return { success: true, simulated: false }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.on('terminal:input', (_e, id: string, data: string) => {
    const t = terminals.get(id)
    if (t && !t.simulated) t.write(data)
  })

  ipcMain.on('terminal:resize', (_e, id: string, cols: number, rows: number) => {
    const t = terminals.get(id)
    if (t && !t.simulated) t.resize(cols, rows)
  })

  ipcMain.on('terminal:close', (_e, id: string) => {
    const t = terminals.get(id)
    if (t) {
      if (!t.simulated) t.kill()
      terminals.delete(id)
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
  // Cleanup watchers
  for (const cleanup of worktreeWatchers.values()) cleanup()
  worktreeWatchers.clear()
  // Cleanup terminals
  for (const t of terminals.values()) {
    if (!t.simulated) t.kill()
  }
  terminals.clear()
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
