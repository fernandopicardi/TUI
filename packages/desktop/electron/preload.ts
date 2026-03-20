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
    watchProjectWorktrees: (projectId: string, rootPath: string) =>
      ipcRenderer.invoke('git:watch-project-worktrees', projectId, rootPath),
    unwatchProjectWorktrees: (projectId: string) =>
      ipcRenderer.send('git:unwatch-project-worktrees', projectId),
    onProjectWorktreesChanged: (cb: (projectId: string, worktrees: any[]) => void) => {
      const handler = (_event: unknown, pid: string, wts: any[]) => cb(pid, wts)
      ipcRenderer.on('git:project-worktrees-changed', handler)
      return () => { ipcRenderer.removeListener('git:project-worktrees-changed', handler) }
    },
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
    getBuffer: (id: string) =>
      ipcRenderer.invoke('terminal:get-buffer', id),
    isAlive: (id: string) =>
      ipcRenderer.invoke('terminal:is-alive', id),
    injectWhenReady: (id: string, prompt: string) =>
      ipcRenderer.invoke('terminal:inject-when-ready', id, prompt),
  },
  files: {
    list: (rootPath: string) =>
      ipcRenderer.invoke('files:list', rootPath),
    read: (filePath: string) =>
      ipcRenderer.invoke('files:read', filePath),
  },
  github: {
    getDiff: (worktreePath: string) =>
      ipcRenderer.invoke('github:get-diff', worktreePath),
    createPR: (data: { worktreePath: string; title: string; description: string; baseBranch: string; branch: string }) =>
      ipcRenderer.invoke('github:create-pr', data),
  },
  mcp: {
    getConfig: (rootPath: string) =>
      ipcRenderer.invoke('mcp:get-config', rootPath),
    addServer: (rootPath: string, server: any, scope: 'global' | 'project') =>
      ipcRenderer.invoke('mcp:add-server', rootPath, server, scope),
    removeServer: (rootPath: string, name: string, scope: 'global' | 'project') =>
      ipcRenderer.invoke('mcp:remove-server', rootPath, name, scope),
  },
  settings: {
    readGlobal: () => ipcRenderer.invoke('settings:read-global'),
    writeGlobal: (data: Record<string, any>) => ipcRenderer.invoke('settings:write-global', data),
    readProject: (rootPath: string) => ipcRenderer.invoke('settings:read-project', rootPath),
    writeProject: (rootPath: string, data: Record<string, any>) => ipcRenderer.invoke('settings:write-project', rootPath, data),
    testGithub: (token: string) => ipcRenderer.invoke('settings:test-github', token),
  },
  notify: (title: string, body: string, type: string) =>
    ipcRenderer.send('notify', title, body, type),
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
})
