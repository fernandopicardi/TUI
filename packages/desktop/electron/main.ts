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

// ── Claude Code readiness signals ──
const CLAUDE_READY_SIGNALS = [
  '✻ Welcome to Claude Code',
  'claude>',
  'Human:',
  '─────',
  '? ',
  'Tips for getting started',
]

// Terminal registry — survives navigation, persistent across renderer lifecycle
const terminalRegistry = new Map<string, {
  pty: any
  buffer: string[]
  isAlive: boolean
  simulated: boolean
  isClaudeReady: boolean
  pendingPrompt: string | null
}>()

// Worktree project watchers — polls worktrees per project
const projectWorktreeWatchers = new Map<string, NodeJS.Timeout>()

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
      const root = await getRepoRoot(dir)
      if (!root) return null
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

  // ── Worktree sync per project (Subtask 2) ──
  ipcMain.handle('git:watch-project-worktrees', async (event, projectId: string, rootPath: string) => {
    const existing = projectWorktreeWatchers.get(projectId)
    if (existing) clearInterval(existing)

    let lastSnapshot = ''

    const check = async () => {
      try {
        const worktrees = await listWorktrees(normalizePath(rootPath))
        const serialized = JSON.parse(JSON.stringify(worktrees))
        const snapshot = JSON.stringify(serialized.map((w: any) => w.path).sort())
        if (snapshot !== lastSnapshot) {
          lastSnapshot = snapshot
          BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
              win.webContents.send('git:project-worktrees-changed', projectId, serialized)
            }
          })
        }
      } catch {}
    }

    await check()
    const interval = setInterval(check, 3000)
    projectWorktreeWatchers.set(projectId, interval)

    return { success: true }
  })

  ipcMain.on('git:unwatch-project-worktrees', (_: any, projectId: string) => {
    const w = projectWorktreeWatchers.get(projectId)
    if (w) { clearInterval(w); projectWorktreeWatchers.delete(projectId) }
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

  // ── GitHub / Create PR (Subtask 4) ──
  ipcMain.handle('github:create-pr', async (_e, data: {
    worktreePath: string
    title: string
    description: string
    baseBranch: string
    branch: string
  }) => {
    try {
      // Read token from global settings (~/.agentflow/config.json), NOT project config
      let token = process.env.GITHUB_TOKEN
      try {
        const raw = await fs.promises.readFile(globalConfigPath(), 'utf-8')
        const globalSettings = JSON.parse(raw)
        if (globalSettings.githubToken) token = globalSettings.githubToken
      } catch { /* no global config, rely on env var */ }
      if (!token) return { success: false, error: 'no_token' }

      const git = simpleGit(normalizePath(data.worktreePath))
      const remotes = await git.getRemotes(true)
      const origin = remotes.find(r => r.name === 'origin')
      if (!origin) return { success: false, error: 'no_remote' }

      const match = origin.refs.push.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/)
      if (!match) return { success: false, error: 'not_github' }
      const [, owner, repo] = match

      await git.push('origin', data.branch, ['--set-upstream'])

      const response = await (globalThis as any).fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json',
          },
          body: JSON.stringify({
            title: data.title,
            body: data.description,
            head: data.branch,
            base: data.baseBranch,
          }),
        }
      )

      const result = await response.json()
      if (!response.ok) return { success: false, error: result.message }
      return { success: true, url: result.html_url, number: result.number }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ── Terminal (persistent registry with Claude readiness detection) ──
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
      const entry = { pty: null, buffer: [] as string[], isAlive: true, simulated: true, isClaudeReady: false, pendingPrompt: null as string | null }
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

      const entry = { pty, buffer: [] as string[], isAlive: true, simulated: false, isClaudeReady: false, pendingPrompt: null as string | null }
      terminalRegistry.set(id, entry)

      pty.onData((data: string) => {
        // Keep last 1000 chunks for replay on reconnect
        entry.buffer.push(data)
        if (entry.buffer.length > 1000) entry.buffer.shift()

        // Claude readiness detection
        if (!entry.isClaudeReady) {
          const recentOutput = entry.buffer.slice(-10).join('')
          const ready = CLAUDE_READY_SIGNALS.some(s => recentOutput.includes(s))

          if (ready) {
            entry.isClaudeReady = true

            // Send readiness notification to renderer
            BrowserWindow.getAllWindows().forEach(win => {
              if (!win.isDestroyed()) {
                win.webContents.send('terminal:output', id,
                  '\x1b[33m[agentflow]\x1b[0m Claude Code ready\r\n')
              }
            })

            if (entry.pendingPrompt) {
              const prompt = entry.pendingPrompt
              entry.pendingPrompt = null
              setTimeout(() => {
                if (entry.isAlive && entry.pty) {
                  entry.pty.write(prompt + '\r')
                  BrowserWindow.getAllWindows().forEach(win => {
                    if (!win.isDestroyed()) {
                      win.webContents.send('terminal:output', id,
                        '\x1b[32m[agentflow]\x1b[0m prompt injected \u2713\r\n')
                    }
                  })
                }
              }, 500)
            }
          }
        }

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

  // Inject prompt when Claude Code is ready
  ipcMain.handle('terminal:inject-when-ready', (_: any, terminalId: string, prompt: string) => {
    const entry = terminalRegistry.get(terminalId)
    if (!entry) return { success: false }

    if (entry.isClaudeReady) {
      if (entry.pty) entry.pty.write(prompt + '\r')
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('terminal:output', terminalId,
            '\x1b[32m[agentflow]\x1b[0m prompt injected \u2713\r\n')
        }
      })
      return { success: true, immediate: true }
    }

    entry.pendingPrompt = prompt
    // Show waiting message
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('terminal:output', terminalId,
          '\x1b[33m[agentflow]\x1b[0m waiting for Claude Code...\r\n')
      }
    })
    return { success: true, queued: true }
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
    if (!entry || entry.simulated || !entry.pty) return

    // ConPTY on Windows truncates large writes. Chunk paste data into safe blocks.
    const CHUNK_SIZE = 1024
    if (data.length <= CHUNK_SIZE) {
      entry.pty.write(data)
    } else {
      const chunks: string[] = []
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        chunks.push(data.slice(i, i + CHUNK_SIZE))
      }
      let idx = 0
      const writeNext = () => {
        if (idx >= chunks.length) return
        const currentEntry = terminalRegistry.get(id)
        if (!currentEntry || !currentEntry.pty) return
        currentEntry.pty.write(chunks[idx])
        idx++
        if (idx < chunks.length) setTimeout(writeNext, 5)
      }
      writeNext()
    }
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
      const git = simpleGit()
      await git.clone(url, fullPath)
      return { success: true, path: fullPath }
    } catch (err: any) {
      console.error('[agentflow] clone error:', err)
      return { success: false, error: err.message }
    }
  })

  // ── MCP Config (Subtask 5) ──
  ipcMain.handle('mcp:get-config', async (_e, rootPath: string) => {
    const servers: any[] = []

    // 1. Global: ~/.claude/settings.json
    try {
      const home = process.env.USERPROFILE || process.env.HOME || ''
      const globalPath = path.join(home, '.claude', 'settings.json')
      const raw = await fs.promises.readFile(globalPath, 'utf-8')
      const parsed = JSON.parse(raw)
      Object.entries(parsed.mcpServers || {}).forEach(([name, cfg]: any) => {
        servers.push({ name, ...cfg, scope: 'global' })
      })
    } catch {}

    // 2. Project: .claude/settings.json
    try {
      const projectPath = path.join(normalizePath(rootPath), '.claude', 'settings.json')
      const raw = await fs.promises.readFile(projectPath, 'utf-8')
      const parsed = JSON.parse(raw)
      Object.entries(parsed.mcpServers || {}).forEach(([name, cfg]: any) => {
        if (!servers.find(s => s.name === name)) {
          servers.push({ name, ...cfg, scope: 'project' })
        }
      })
    } catch {}

    return servers
  })

  ipcMain.handle('mcp:add-server', async (_e, rootPath: string, server: any, scope: 'global' | 'project') => {
    try {
      const targetPath = scope === 'global'
        ? path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'settings.json')
        : path.join(normalizePath(rootPath), '.claude', 'settings.json')

      let settings: any = {}
      try {
        const raw = await fs.promises.readFile(targetPath, 'utf-8')
        settings = JSON.parse(raw)
      } catch {}

      settings.mcpServers = settings.mcpServers || {}
      settings.mcpServers[server.name] = {
        command: server.command,
        args: server.args || [],
        ...(server.env ? { env: server.env } : {}),
      }

      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
      await fs.promises.writeFile(targetPath, JSON.stringify(settings, null, 2))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('mcp:remove-server', async (_e, rootPath: string, name: string, scope: 'global' | 'project') => {
    try {
      const targetPath = scope === 'global'
        ? path.join(process.env.USERPROFILE || process.env.HOME || '', '.claude', 'settings.json')
        : path.join(normalizePath(rootPath), '.claude', 'settings.json')

      const raw = await fs.promises.readFile(targetPath, 'utf-8')
      const settings = JSON.parse(raw)
      delete settings.mcpServers?.[name]
      await fs.promises.writeFile(targetPath, JSON.stringify(settings, null, 2))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ── Settings (Subtask 6) ──
  const globalConfigPath = () => {
    const home = process.env.USERPROFILE || process.env.HOME || ''
    return path.join(home, '.agentflow', 'config.json')
  }

  ipcMain.handle('settings:read-global', async () => {
    try {
      const raw = await fs.promises.readFile(globalConfigPath(), 'utf-8')
      return JSON.parse(raw)
    } catch {
      return {}
    }
  })

  ipcMain.handle('settings:write-global', async (_e, data: Record<string, any>) => {
    try {
      const p = globalConfigPath()
      await fs.promises.mkdir(path.dirname(p), { recursive: true })
      await fs.promises.writeFile(p, JSON.stringify(data, null, 2))
      return { success: true }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle('settings:read-project', async (_e, rootPath: string) => {
    try {
      const p = path.join(normalizePath(rootPath), 'agentflow.config.json')
      const raw = await fs.promises.readFile(p, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return {}
    }
  })

  ipcMain.handle('settings:write-project', async (_e, rootPath: string, data: Record<string, any>) => {
    try {
      const p = path.join(normalizePath(rootPath), 'agentflow.config.json')
      await fs.promises.writeFile(p, JSON.stringify(data, null, 2))
      return { success: true }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle('settings:test-github', async (_e, token: string) => {
    try {
      const res = await (globalThis as any).fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const user = await res.json()
      return res.ok ? { success: true, login: user.login, avatar: user.avatar_url } : { success: false }
    } catch {
      return { success: false }
    }
  })

  // ── Git history ──
  ipcMain.handle('git:log', async (_e, worktreePath: string, options?: { maxCount?: number }) => {
    try {
      const git = simpleGit(normalizePath(worktreePath))

      // Use simple-git's built-in log to avoid format string issues on Windows
      const logResult = await git.log({
        '--all': null,
        '--decorate': 'full',
        maxCount: options?.maxCount ?? 500,
      } as any)

      const commits = logResult.all.map((entry: any) => {
        const refsRaw = entry.refs || ''
        return {
          hash: entry.hash || '',
          hashShort: (entry.hash || '').slice(0, 7),
          message: entry.message || '',
          body: entry.body || '',
          author: entry.author_name || '',
          authorEmail: entry.author_email || '',
          date: entry.date || '',
          refs: refsRaw ? refsRaw.split(',').map((r: string) => r.trim()).filter(Boolean) : [],
          parents: [],  // populated below
        }
      })

      // Get parent info via raw command (safe, no body field)
      try {
        const parentRaw = await git.raw([
          'log', '--all', `--max-count=${options?.maxCount ?? 500}`,
          '--format=%H %P',
        ])
        const parentMap = new Map<string, string[]>()
        parentRaw.split('\n').filter(Boolean).forEach(line => {
          const parts = line.trim().split(' ')
          const hash = parts[0]
          const parents = parts.slice(1).filter(Boolean)
          if (hash) parentMap.set(hash, parents)
        })
        commits.forEach((c: any) => {
          c.parents = parentMap.get(c.hash) || []
        })
      } catch { /* parents optional */ }

      let currentBranch = 'main'
      try {
        currentBranch = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim()
      } catch {}

      let branches: string[] = []
      try {
        const branchSummary = await git.branch(['--all'])
        branches = Object.keys(branchSummary.branches)
      } catch {}

      return JSON.parse(JSON.stringify({
        commits,
        branches,
        currentBranch,
        error: null,
      }))
    } catch (err: any) {
      console.error('[agentflow] git:log error:', err)
      return { commits: [], branches: [], currentBranch: 'main', error: err.message }
    }
  })

  ipcMain.handle('git:commit-files', async (_e, worktreePath: string, hash: string) => {
    try {
      const git = simpleGit(normalizePath(worktreePath))
      const result = await git.raw(['diff-tree', '--no-commit-id', '-r', '--name-status', hash])
      const files = result
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [status, ...pathParts] = line.split('\t')
          return { status: status.trim(), path: pathParts.join('\t').trim() }
        })
      return JSON.parse(JSON.stringify(files))
    } catch {
      return []
    }
  })

  ipcMain.handle('git:get-avatar', async (_e, email: string) => {
    try {
      const { createHash } = require('crypto')
      const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex')
      return { url: `https://www.gravatar.com/avatar/${hash}?d=identicon&s=64`, source: 'gravatar' }
    } catch {
      return { url: null, source: 'none' }
    }
  })

  ipcMain.handle('git:checkout', async (_e, worktreePath: string, ref: string) => {
    try {
      const git = simpleGit(normalizePath(worktreePath))
      await git.checkout(ref)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ── File tree ──
  ipcMain.handle('files:list', async (_e, rootPath: string) => {
    const normalized = normalizePath(rootPath)

    // Get git status for all files
    let gitStatusMap: Record<string, string> = {}
    try {
      const git = simpleGit(normalized)
      const status = await git.status()
      status.modified.forEach(f => { gitStatusMap[f] = 'M' })
      status.created.forEach(f => { gitStatusMap[f] = 'A' })
      status.deleted.forEach(f => { gitStatusMap[f] = 'D' })
      status.not_added.forEach(f => { gitStatusMap[f] = '?' })
    } catch {}

    // Recursively read directory tree
    const IGNORE = new Set(['node_modules', '.git', 'dist', 'release', '.turbo', '.next', '__pycache__', '.cache', 'coverage'])
    const MAX_DEPTH = 5
    const MAX_FILES = 500

    let fileCount = 0

    const readDir = async (dirPath: string, relativePath: string, depth: number): Promise<any[]> => {
      if (depth > MAX_DEPTH || fileCount > MAX_FILES) return []

      let entries: any[]
      try {
        entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
      } catch {
        return []
      }

      // Sort: directories first, then files, both alphabetical
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1
        if (!a.isDirectory() && b.isDirectory()) return 1
        return a.name.localeCompare(b.name)
      })

      const result: any[] = []
      for (const entry of entries) {
        if (fileCount > MAX_FILES) break
        if (IGNORE.has(entry.name) || entry.name.startsWith('.')) continue

        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          const children = await readDir(fullPath, relPath, depth + 1)
          result.push({
            name: entry.name,
            path: relPath,
            type: 'directory',
            gitStatus: '',
            children,
          })
        } else {
          fileCount++
          result.push({
            name: entry.name,
            path: relPath,
            type: 'file',
            gitStatus: gitStatusMap[relPath] || '',
          })
        }
      }
      return result
    }

    try {
      return await readDir(normalized, '', 0)
    } catch {
      return []
    }
  })

  ipcMain.handle('files:read', async (_e, filePath: string) => {
    try {
      const normalized = normalizePath(filePath)
      const stat = await fs.promises.stat(normalized)
      if (stat.size > 512 * 1024) {
        return { success: false, error: 'File too large (>512KB)' }
      }
      // Check if binary
      const buffer = await fs.promises.readFile(normalized)
      const isBinary = buffer.includes(0)
      if (isBinary) {
        return { success: true, binary: true, content: `[Binary file, ${stat.size} bytes]` }
      }
      return { success: true, content: buffer.toString('utf-8') }
    } catch (err: any) {
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
  for (const interval of projectWorktreeWatchers.values()) clearInterval(interval)
  projectWorktreeWatchers.clear()
  for (const entry of terminalRegistry.values()) {
    if (!entry.simulated && entry.pty) entry.pty.kill()
  }
  terminalRegistry.clear()
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
