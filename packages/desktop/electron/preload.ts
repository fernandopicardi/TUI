// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import { contextBridge, ipcRenderer, clipboard } from 'electron'

contextBridge.exposeInMainWorld('runnio', {
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
  },
  git: {
    listWorktrees: (rootPath: string) =>
      ipcRenderer.invoke('git:list-worktrees', rootPath),
    createWorktree: (rootPath: string, branch: string) =>
      ipcRenderer.invoke('git:create-worktree', rootPath, branch),
    removeWorktree: (rootPath: string, worktreePath: string, deleteBranch?: boolean) =>
      ipcRenderer.invoke('git:remove-worktree', rootPath, worktreePath, deleteBranch),
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
    log: (worktreePath: string, options?: { maxCount?: number }) =>
      ipcRenderer.invoke('git:log', worktreePath, options),
    commitFiles: (worktreePath: string, hash: string) =>
      ipcRenderer.invoke('git:commit-files', worktreePath, hash),
    getAvatar: (email: string) =>
      ipcRenderer.invoke('git:get-avatar', email),
    checkout: (worktreePath: string, ref: string) =>
      ipcRenderer.invoke('git:checkout', worktreePath, ref),
    watchProjectWorktrees: (projectId: string, rootPath: string) =>
      ipcRenderer.invoke('git:watch-project-worktrees', projectId, rootPath),
    unwatchProjectWorktrees: (projectId: string) =>
      ipcRenderer.send('git:unwatch-project-worktrees', projectId),
    onProjectWorktreesChanged: (cb: (projectId: string, worktrees: any[]) => void) => {
      const handler = (_event: unknown, pid: string, wts: any[]) => cb(pid, wts)
      ipcRenderer.on('git:project-worktrees-changed', handler)
      return () => { ipcRenderer.removeListener('git:project-worktrees-changed', handler) }
    },
    workingStatus: (worktreePath: string) =>
      ipcRenderer.invoke('git:working-status', worktreePath),
    stageAll: (worktreePath: string) =>
      ipcRenderer.invoke('git:stage-all', worktreePath),
    commitChanges: (worktreePath: string, message: string) =>
      ipcRenderer.invoke('git:commit-changes', worktreePath, message),
  },
  agents: {
    getStatus: (worktreePath: string) =>
      ipcRenderer.invoke('agent:get-status', worktreePath),
    detectAll: () =>
      ipcRenderer.invoke('agents:detect-all'),
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
    createGlobal: (config: { workingDir: string; terminalId: string; command: string }) =>
      ipcRenderer.invoke('terminal:create-global', config),
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
    listIssues: (rootPath: string) =>
      ipcRenderer.invoke('github:list-issues', rootPath),
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
  clipboard: {
    readText: () => clipboard.readText(),
    writeText: (text: string) => clipboard.writeText(text),
  },
  shell: {
    openPath: (fullPath: string) => ipcRenderer.invoke('shell:open-path', fullPath),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
})
