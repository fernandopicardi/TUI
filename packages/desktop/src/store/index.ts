// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Project, AgentSession, Toast, RunnioTask, TaskStatus } from '../types'
import { canAddProject, canAddAgent, PLAN_FLAGS } from '../features'
import { Theme } from '../styles/themes'

export interface RunnioStore {
  // State
  projects: Project[]
  activeProjectId: string | null
  activeAgentId: string | null
  activeView: 'home' | 'dashboard' | 'workspace' | 'kanban' | 'global-history'
  navigationHistory: string[]
  navigationIndex: number
  isContextPanelOpen: boolean
  isRightPanelOpen: boolean
  rightPanelTab: 'files' | 'diff' | 'pr' | 'notes' | 'changes'
  mainPanelTab: 'terminal' | 'history' | 'diff' | 'pr' | 'notes'
  isBrowserPreviewOpen: boolean
  isGlobalTerminalModalOpen: boolean
  isCreateAgentModalOpen: boolean
  isAddProjectModalOpen: boolean
  isSettingsOpen: boolean
  isCommandPaletteOpen: boolean
  isQuickPromptOpen: boolean
  isDeleteAgentModalOpen: boolean
  deleteAgentTarget: { projectId: string; agentId: string } | null
  toasts: Toast[]
  initPrompt: string | null

  // Project actions
  addProject: (project: Omit<Project, 'agents' | 'addedAt' | 'lastOpenedAt'>) => void
  removeProject: (projectId: string) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  setActiveProject: (projectId: string | null) => void

  // Agent actions
  addAgent: (projectId: string, agent: AgentSession) => void
  removeAgent: (projectId: string, agentId: string) => void
  updateAgent: (agentId: string, updates: Partial<AgentSession>) => void
  setActiveAgent: (agentId: string | null) => void
  setAgentLaunched: (agentId: string, config: AgentSession['launchConfig']) => void
  archiveAgent: (projectId: string, agentId: string) => void
  unarchiveAgent: (projectId: string, agentId: string) => void

  // Default launch settings
  defaultModel: string
  defaultMode: 'normal' | 'plan' | 'auto'
  setDefaultModel: (model: string) => void
  setDefaultMode: (mode: 'normal' | 'plan' | 'auto') => void

  // Theme + terminal appearance
  theme: Theme
  setTheme: (theme: Theme) => void
  terminalFont: string
  terminalFontSize: number
  setTerminalFont: (font: string) => void
  setTerminalFontSize: (size: number) => void

  // App settings (persisted)
  refreshInterval: number
  createWorktreeByDefault: boolean
  branchPattern: string
  notifications: boolean
  setRefreshInterval: (ms: number) => void
  setCreateWorktreeByDefault: (v: boolean) => void
  setBranchPattern: (pattern: string) => void
  setNotifications: (v: boolean) => void

  // Navigation
  navigateTo: (view: 'home' | 'dashboard' | 'workspace') => void
  navigateBack: () => void
  navigateForward: () => void
  canNavigateBack: () => boolean
  canNavigateForward: () => boolean

  // UI actions
  openAddProject: () => void
  closeAddProject: () => void
  openCreateAgent: () => void
  closeCreateAgent: () => void
  openSettings: () => void
  closeSettings: () => void
  toggleContextPanel: () => void
  toggleRightPanel: (tab?: 'files' | 'diff' | 'pr' | 'notes' | 'changes') => void
  setMainPanelTab: (tab: 'terminal' | 'history' | 'diff' | 'pr' | 'notes') => void
  openGlobalHistory: () => void
  toggleBrowserPreview: () => void
  openGlobalTerminalModal: () => void
  closeGlobalTerminalModal: () => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  openQuickPrompt: () => void
  closeQuickPrompt: () => void
  openDeleteAgent: (projectId: string, agentId: string) => void
  closeDeleteAgent: () => void

  // Toast
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void
  dismissToast: (id: string) => void

  // Prompt
  setInitPrompt: (prompt: string | null) => void

  // Split terminal
  splitAgentIds: string[]
  isSplitMode: boolean
  toggleSplitMode: () => void
  addSplitAgent: (agentId: string) => void
  removeSplitAgent: (agentId: string) => void
  clearSplit: () => void

  // Tasks
  tasks: RunnioTask[]
  addTask: (task: RunnioTask) => void
  updateTask: (taskId: string, updates: Partial<RunnioTask>) => void
  moveTask: (taskId: string, status: TaskStatus) => void
  removeTask: (taskId: string) => void
  archiveDoneTasks: () => void
  getTaskForAgent: (agentId: string) => RunnioTask | undefined
  getTasksForProject: (projectId: string) => RunnioTask[]

  // Computed helpers
  getActiveProject: () => Project | null
  getActiveAgent: () => AgentSession | null
  getAllAgents: () => AgentSession[]
  getProjectById: (id: string) => Project | null
}

export const useStore = create<RunnioStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      activeAgentId: null,
      activeView: 'home' as 'home' | 'dashboard' | 'workspace',
      navigationHistory: [] as string[],
      navigationIndex: -1,
      isContextPanelOpen: false,
      isRightPanelOpen: false,
      rightPanelTab: 'files' as 'files' | 'diff' | 'pr' | 'notes' | 'changes',
      mainPanelTab: 'terminal' as 'terminal' | 'history' | 'diff' | 'pr' | 'notes',
      isBrowserPreviewOpen: false,
      isGlobalTerminalModalOpen: false,
      isCreateAgentModalOpen: false,
      isAddProjectModalOpen: false,
      isSettingsOpen: false,
      isCommandPaletteOpen: false,
      isQuickPromptOpen: false,
      isDeleteAgentModalOpen: false,
      deleteAgentTarget: null,
      toasts: [],
      initPrompt: null,
      splitAgentIds: [] as string[],
      isSplitMode: false,
      defaultModel: '',
      defaultMode: 'normal' as 'normal' | 'plan' | 'auto',
      theme: 'dark-navy' as Theme,
      terminalFont: 'Consolas',
      terminalFontSize: 13,
      refreshInterval: 2000,
      createWorktreeByDefault: true,
      branchPattern: 'runnio/{branch}',
      notifications: true,

      addProject: (projectData) => {
        const state = get()
        if (!canAddProject(state.projects.length)) {
          state.showToast(
            `Free plan is limited to ${PLAN_FLAGS.free.maxProjects} projects. Upgrade to Pro for unlimited projects.`,
            'warning'
          )
          return
        }
        set(s => ({
          projects: [...s.projects, {
            ...projectData,
            agents: [],
            addedAt: Date.now(),
            lastOpenedAt: Date.now(),
          }],
          activeProjectId: projectData.id,
        }))
      },

      removeProject: (projectId) => set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
        activeAgentId: state.projects.find(p => p.id === projectId)?.agents.some(a => a.id === state.activeAgentId)
          ? null : state.activeAgentId,
      })),

      updateProject: (projectId, updates) => set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId ? { ...p, ...updates } : p
        ),
      })),

      setActiveProject: (projectId) => set({
        activeProjectId: projectId,
        activeAgentId: null,
        activeView: projectId ? 'dashboard' : 'home',
        isSplitMode: false,
        splitAgentIds: [],
      }),

      addAgent: (projectId, agent) => {
        const state = get()
        const project = state.projects.find(p => p.id === projectId)
        if (project && !canAddAgent(project.agents.length)) {
          state.showToast(
            `Free plan is limited to ${PLAN_FLAGS.free.maxAgentsPerProject} agents per project. Upgrade to Pro for unlimited agents.`,
            'warning'
          )
          return
        }
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, agents: [...p.agents, { ...agent, hasLaunched: agent.hasLaunched ?? false }] }
              : p
          ),
          activeAgentId: agent.id,
        }))
      },

      removeAgent: (projectId, agentId) => set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? { ...p, agents: p.agents.filter(a => a.id !== agentId) }
            : p
        ),
        activeAgentId: state.activeAgentId === agentId ? null : state.activeAgentId,
      })),

      updateAgent: (agentId, updates) => {
        // Sanitize status to prevent Objects-as-React-children crash (#310)
        const safe = { ...updates }
        if (safe.status && typeof safe.status !== 'string') {
          safe.status = 'idle'
        }
        set(state => ({
          projects: state.projects.map(p => ({
            ...p,
            agents: p.agents.map(a =>
              a.id === agentId ? { ...a, ...safe } : a
            ),
          })),
        }))
      },

      setActiveAgent: (agentId) => {
        if (agentId) {
          const s = get()
          const newHistory = [...s.navigationHistory.slice(0, s.navigationIndex + 1), agentId]
          set({
            activeAgentId: agentId,
            activeView: 'workspace',
            mainPanelTab: 'terminal',
            navigationHistory: newHistory,
            navigationIndex: newHistory.length - 1,
          })
        } else {
          set({ activeAgentId: null, activeView: get().activeProjectId ? 'dashboard' : 'home' })
        }
      },

      setAgentLaunched: (agentId, config) => set(state => ({
        projects: state.projects.map(p => ({
          ...p,
          agents: p.agents.map(a =>
            a.id === agentId
              ? { ...a, hasLaunched: true, launchConfig: config }
              : a
          ),
        })),
      })),

      archiveAgent: (projectId, agentId) => {
        const s = get()
        // Kill terminal before archiving
        window.runnio?.terminal?.close(agentId)
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  agents: p.agents.map(a =>
                    a.id === agentId
                      ? { ...a, archived: true, archivedAt: Date.now(), isTerminalAlive: false }
                      : a
                  ),
                }
              : p
          ),
          activeAgentId: state.activeAgentId === agentId ? null : state.activeAgentId,
        }))
      },

      unarchiveAgent: (projectId, agentId) => set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                agents: p.agents.map(a =>
                  a.id === agentId
                    ? { ...a, archived: false, archivedAt: undefined, hasLaunched: false }
                    : a
                ),
              }
            : p
        ),
      })),

      setDefaultModel: (model) => set({ defaultModel: model }),
      setDefaultMode: (mode) => set({ defaultMode: mode }),
      setTheme: (theme) => set({ theme }),
      setTerminalFont: (font) => set({ terminalFont: font }),
      setTerminalFontSize: (size) => set({ terminalFontSize: size }),
      setRefreshInterval: (ms) => set({ refreshInterval: ms }),
      setCreateWorktreeByDefault: (v) => set({ createWorktreeByDefault: v }),
      setBranchPattern: (pattern) => set({ branchPattern: pattern }),
      setNotifications: (v) => set({ notifications: v }),

      // Navigation
      navigateTo: (view) => set({ activeView: view as any, activeAgentId: view === 'workspace' ? get().activeAgentId : null }),
      navigateBack: () => {
        const s = get()
        if (s.navigationIndex > 0) {
          const newIndex = s.navigationIndex - 1
          const agentId = s.navigationHistory[newIndex]
          set({ navigationIndex: newIndex, activeAgentId: agentId, activeView: 'workspace' })
        } else {
          set({ activeAgentId: null, activeView: s.activeProjectId ? 'dashboard' : 'home' })
        }
      },
      navigateForward: () => {
        const s = get()
        if (s.navigationIndex < s.navigationHistory.length - 1) {
          const newIndex = s.navigationIndex + 1
          const agentId = s.navigationHistory[newIndex]
          set({ navigationIndex: newIndex, activeAgentId: agentId, activeView: 'workspace' })
        }
      },
      canNavigateBack: () => {
        const s = get()
        return s.navigationIndex > 0 || !!s.activeAgentId
      },
      canNavigateForward: () => {
        const s = get()
        return s.navigationIndex < s.navigationHistory.length - 1
      },

      openAddProject: () => set({ isAddProjectModalOpen: true }),
      closeAddProject: () => set({ isAddProjectModalOpen: false }),
      openCreateAgent: () => set({ isCreateAgentModalOpen: true }),
      closeCreateAgent: () => set({ isCreateAgentModalOpen: false }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      toggleContextPanel: () => set(s => ({ isContextPanelOpen: !s.isContextPanelOpen })),
      toggleRightPanel: (tab) => set(s => {
        if (tab && s.isRightPanelOpen && s.rightPanelTab === tab) {
          return { isRightPanelOpen: false }
        }
        return { isRightPanelOpen: true, rightPanelTab: tab || s.rightPanelTab }
      }),
      setMainPanelTab: (tab) => set(s => {
        // If toggling same tab, go back to terminal
        if (s.mainPanelTab === tab && tab !== 'terminal') {
          return { mainPanelTab: 'terminal' as const }
        }
        // Auto-close right panel when opening diff/pr/notes in main
        const closeRight = tab === 'diff' || tab === 'pr' || tab === 'notes'
        return {
          mainPanelTab: tab,
          isRightPanelOpen: closeRight ? false : s.isRightPanelOpen,
        }
      }),
      openGlobalHistory: () => set({ activeView: 'global-history', activeAgentId: null }),
      toggleBrowserPreview: () => set(s => ({ isBrowserPreviewOpen: !s.isBrowserPreviewOpen })),
      openGlobalTerminalModal: () => set({ isGlobalTerminalModalOpen: true }),
      closeGlobalTerminalModal: () => set({ isGlobalTerminalModalOpen: false }),
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      openQuickPrompt: () => set({ isQuickPromptOpen: true }),
      closeQuickPrompt: () => set({ isQuickPromptOpen: false }),
      openDeleteAgent: (projectId, agentId) => set({ isDeleteAgentModalOpen: true, deleteAgentTarget: { projectId, agentId } }),
      closeDeleteAgent: () => set({ isDeleteAgentModalOpen: false, deleteAgentTarget: null }),

      showToast: (message, type = 'info') => {
        const id = Date.now().toString()
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => get().dismissToast(id), 3000)
      },
      dismissToast: (id) => set(s => ({
        toasts: s.toasts.filter(t => t.id !== id),
      })),

      setInitPrompt: (prompt) => set({ initPrompt: prompt }),

      // Split terminal
      toggleSplitMode: () => {
        const s = get()
        if (s.isSplitMode) {
          set({ isSplitMode: false, splitAgentIds: [] })
        } else if (s.activeAgentId) {
          set({ isSplitMode: true, splitAgentIds: [s.activeAgentId] })
        }
      },
      addSplitAgent: (agentId) => set(s => {
        if (s.splitAgentIds.includes(agentId) || s.splitAgentIds.length >= 4) return s
        return { splitAgentIds: [...s.splitAgentIds, agentId], isSplitMode: true }
      }),
      removeSplitAgent: (agentId) => set(s => {
        const next = s.splitAgentIds.filter(id => id !== agentId)
        if (next.length === 0) return { splitAgentIds: [], isSplitMode: false }
        return { splitAgentIds: next }
      }),
      clearSplit: () => set({ isSplitMode: false, splitAgentIds: [] }),

      // Tasks
      tasks: [] as RunnioTask[],
      addTask: (task) => set(s => ({ tasks: [...s.tasks, task] })),
      updateTask: (taskId, updates) => set(s => ({
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t),
      })),
      moveTask: (taskId, status) => set(s => ({
        tasks: s.tasks.map(t => t.id === taskId ? {
          ...t, status, updatedAt: Date.now(),
          activityLog: [...t.activityLog, { action: `Moved to ${status}`, timestamp: Date.now() }],
        } : t),
      })),
      removeTask: (taskId) => set(s => ({ tasks: s.tasks.filter(t => t.id !== taskId) })),
      archiveDoneTasks: () => set(s => ({
        tasks: s.tasks.map(t => t.status === 'done' ? { ...t, archived: true, updatedAt: Date.now() } : t),
      })),
      getTaskForAgent: (agentId) => get().tasks.find(t => t.agentId === agentId && !t.archived),
      getTasksForProject: (projectId) => get().tasks.filter(t => t.projectId === projectId && !t.archived),

      getActiveProject: () => {
        const s = get()
        return s.projects.find(p => p.id === s.activeProjectId) ?? null
      },
      getActiveAgent: () => {
        const s = get()
        for (const p of s.projects) {
          const agent = p.agents.find(a => a.id === s.activeAgentId)
          if (agent) return agent
        }
        return null
      },
      getAllAgents: () => get().projects.flatMap(p => p.agents.filter(a => !a.archived)),
      getProjectById: (id) => get().projects.find(p => p.id === id) ?? null,
    }),
    {
      name: 'runnio-store',
      // Persist projects, active selections, and agent states
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        activeAgentId: state.activeAgentId,
        defaultModel: state.defaultModel,
        defaultMode: state.defaultMode,
        theme: state.theme,
        terminalFont: state.terminalFont,
        terminalFontSize: state.terminalFontSize,
        refreshInterval: state.refreshInterval,
        createWorktreeByDefault: state.createWorktreeByDefault,
        branchPattern: state.branchPattern,
        notifications: state.notifications,
        tasks: state.tasks,
      }),
      // Migrate persisted agents that predate the hasLaunched field
      merge: (persisted: any, current: any) => {
        const merged = { ...current, ...(persisted as object) }
        if (merged.projects) {
          merged.projects = merged.projects.map((p: any) => ({
            ...p,
            name: typeof p.name === 'string' ? p.name : String(p.name || ''),
            plugin: typeof p.plugin === 'string' ? p.plugin : 'raw',
            agents: (p.agents || []).map((a: any) => ({
              ...a,
              hasLaunched: a.hasLaunched ?? true, // existing agents already launched
              // Sanitize fields that MUST be strings (prevent #310: Objects as React children)
              branch: typeof a.branch === 'string' ? a.branch : String(a.branch || ''),
              status: typeof a.status === 'string' ? a.status : 'idle',
              id: typeof a.id === 'string' ? a.id : String(a.id || ''),
              terminalId: typeof a.terminalId === 'string' ? a.terminalId : String(a.terminalId || ''),
              worktreePath: typeof a.worktreePath === 'string' ? a.worktreePath : String(a.worktreePath || ''),
            })),
          }))
        }
        // Validate activeAgentId points to an existing, non-archived agent
        if (merged.activeAgentId && merged.projects) {
          const allAgents = merged.projects.flatMap((p: any) =>
            (p.agents || []).filter((a: any) => !a.archived)
          )
          if (!allAgents.some((a: any) => a.id === merged.activeAgentId)) {
            console.error('[runnio] Hydration: clearing stale activeAgentId:', merged.activeAgentId)
            merged.activeAgentId = null
            merged.activeView = merged.activeProjectId ? 'dashboard' : 'home'
          }
        }
        return merged
      },
    }
  )
)

// Alias for imperative access: store.getState().xxx()
export const store = useStore
