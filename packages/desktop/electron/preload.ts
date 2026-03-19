import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from './ipc/channels'

contextBridge.exposeInMainWorld('agentflow', {
  git: {
    listWorktrees: (rootPath: string) =>
      ipcRenderer.invoke(IPC.LIST_WORKTREES, rootPath),
    createWorktree: (rootPath: string, branch: string) =>
      ipcRenderer.invoke(IPC.CREATE_WORKTREE, rootPath, branch),
    removeWorktree: (rootPath: string, worktreePath: string) =>
      ipcRenderer.invoke(IPC.REMOVE_WORKTREE, rootPath, worktreePath),
    watchWorktrees: (rootPath: string, interval: number) =>
      ipcRenderer.invoke(IPC.WATCH_WORKTREES, rootPath, interval),
    onWorktreesChanged: (cb: (worktrees: unknown[]) => void) => {
      const handler = (_event: unknown, data: unknown[]) => cb(data)
      ipcRenderer.on(IPC.WATCH_WORKTREES, handler)
      return () => ipcRenderer.removeListener(IPC.WATCH_WORKTREES, handler)
    },
    getCurrentBranch: (rootPath: string) =>
      ipcRenderer.invoke(IPC.GET_CURRENT_BRANCH, rootPath),
  },
  agents: {
    getStatus: (worktree: unknown, lastModifiedTime?: number) =>
      ipcRenderer.invoke(IPC.GET_AGENT_STATUS, worktree, lastModifiedTime),
  },
  plugins: {
    resolve: (rootPath: string) =>
      ipcRenderer.invoke(IPC.RESOLVE_PLUGIN, rootPath),
    load: (rootPath: string) =>
      ipcRenderer.invoke(IPC.LOAD_PLUGIN, rootPath),
  },
  config: {
    load: (rootPath: string) =>
      ipcRenderer.invoke(IPC.LOAD_CONFIG, rootPath),
  },
  dialog: {
    openDirectory: () =>
      ipcRenderer.invoke(IPC.OPEN_DIRECTORY),
  },
  window: {
    minimize: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(IPC.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.send(IPC.WINDOW_CLOSE),
  },
})
