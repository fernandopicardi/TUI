import { createStore } from 'zustand/vanilla'
import { WorktreeData, PluginContextData, ConfigData, AgentStatusValue } from '../types'

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
}))

// React hook helper — simple subscribe pattern for use without React bindings
export function getState() {
  return store.getState()
}

export function subscribe(listener: (state: AgentflowStore) => void) {
  return store.subscribe(listener)
}
