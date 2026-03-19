import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('agentflow', {
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
  },
  git: {
    listWorktrees: (rootPath: string) =>
      ipcRenderer.invoke('git:list-worktrees', rootPath),
    createWorktree: (rootPath: string, branch: string) =>
      ipcRenderer.invoke('git:create-worktree', rootPath, branch),
    removeWorktree: (rootPath: string, worktreePath: string) =>
      ipcRenderer.invoke('git:remove-worktree', rootPath, worktreePath),
    watchWorktrees: (rootPath: string, interval: number) =>
      ipcRenderer.invoke('git:watch-worktrees', rootPath, interval),
    onWorktreesChanged: (cb: (worktrees: unknown[]) => void) => {
      const handler = (_event: unknown, data: unknown[]) => cb(data)
      ipcRenderer.on('git:worktrees-changed', handler)
      return () => { ipcRenderer.removeListener('git:worktrees-changed', handler) }
    },
    getCurrentBranch: (rootPath: string) =>
      ipcRenderer.invoke('git:get-current-branch', rootPath),
    clone: (url: string, targetPath: string, folderName: string) =>
      ipcRenderer.invoke('git:clone', url, targetPath, folderName),
  },
  agents: {
    getStatus: (worktreePath: string) =>
      ipcRenderer.invoke('agent:get-status', worktreePath),
  },
  plugins: {
    load: (rootPath: string) =>
      ipcRenderer.invoke('plugin:load', rootPath),
  },
  config: {
    load: (rootPath: string) =>
      ipcRenderer.invoke('config:load', rootPath),
  },
  terminal: {
    create: (id: string, worktreePath: string, command: string) =>
      ipcRenderer.invoke('terminal:create', id, worktreePath, command),
    input: (id: string, data: string) =>
      ipcRenderer.send('terminal:input', id, data),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send('terminal:resize', id, cols, rows),
    onOutput: (cb: (id: string, data: string) => void) => {
      const handler = (_event: unknown, id: string, data: string) => cb(id, data)
      ipcRenderer.on('terminal:output', handler)
      return () => { ipcRenderer.removeListener('terminal:output', handler) }
    },
    close: (id: string) =>
      ipcRenderer.send('terminal:close', id),
  },
  github: {
    getDiff: (worktreePath: string) =>
      ipcRenderer.invoke('github:get-diff', worktreePath),
  },
  notify: (title: string, body: string, type: string) =>
    ipcRenderer.send('notify', title, body, type),
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
})
