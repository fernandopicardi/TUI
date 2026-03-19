import { createStore } from 'zustand/vanilla'
import { WorktreeData, PluginContextData, ConfigData, AgentStatusValue } from '../types'

export interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warning'
}

export interface AgentflowStore {
  // State
  rootPath: string | null
  worktrees: WorktreeData[]
  agentStatuses: Record<string, AgentStatusValue>
  pluginName: string | null
  pluginContext: PluginContextData | null
  config: ConfigData | null
  selectedWorktreeId: string | null
  activeView: 'welcome' | 'dashboard' | 'workspace'
  isLoading: boolean
  error: string | null
  toasts: ToastItem[]
  initPrompt: string | null
  recentProjects: string[]

  // Actions
  setRootPath: (path: string) => void
  setWorktrees: (worktrees: WorktreeData[]) => void
  setAgentStatus: (path: string, status: AgentStatusValue) => void
  setPlugin: (name: string, context: PluginContextData | null) => void
  setConfig: (config: ConfigData) => void
  selectWorktree: (path: string | null) => void
  setActiveView: (view: 'welcome' | 'dashboard' | 'workspace') => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void
  dismissToast: (id: number) => void
  setInitPrompt: (prompt: string | null) => void
  addRecentProject: (path: string) => void
}

let toastId = 0

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem('agentflow:recents') || '[]')
  } catch { return [] }
}

function saveRecents(recents: string[]) {
  try { localStorage.setItem('agentflow:recents', JSON.stringify(recents)) } catch {}
}

export const store = createStore<AgentflowStore>((set) => ({
  rootPath: null,
  worktrees: [],
  agentStatuses: {},
  pluginName: null,
  pluginContext: null,
  config: null,
  selectedWorktreeId: null,
  activeView: 'welcome',
  isLoading: false,
  error: null,
  toasts: [],
  initPrompt: null,
  recentProjects: loadRecents(),

  setRootPath: (rootPath) => set({ rootPath, activeView: 'dashboard', error: null }),
  setWorktrees: (worktrees) => set({ worktrees }),
  setAgentStatus: (path, status) => set((state) => ({
    agentStatuses: { ...state.agentStatuses, [path]: status },
  })),
  setPlugin: (name, context) => set({ pluginName: name, pluginContext: context }),
  setConfig: (config) => set({ config }),
  selectWorktree: (id) => set({
    selectedWorktreeId: id,
    activeView: id ? 'workspace' : 'dashboard',
  }),
  setActiveView: (view) => set({ activeView: view }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  showToast: (message, type = 'info') => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 3000)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  setInitPrompt: (prompt) => set({ initPrompt: prompt }),
  addRecentProject: (path) => set((s) => {
    const recents = [path, ...s.recentProjects.filter(p => p !== path)].slice(0, 5)
    saveRecents(recents)
    return { recentProjects: recents }
  }),
}))
