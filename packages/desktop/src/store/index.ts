// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Project, AgentSession, Toast, RunnioTask, TaskStatus } from '../types'
import { canAddProject, canAddAgent, PLAN_FLAGS } from '../features'

export interface RunnioStore {
  // State
  projects: Project[]
  activeProjectId: string | null
  activeAgentId: string | null
  isContextPanelOpen: boolean
  isCreateAgentModalOpen: boolean
  isAddProjectModalOpen: boolean
  isSettingsOpen: boolean
  isCommandPaletteOpen: boolean
  isQuickPromptOpen: boolean
  toasts: Toast[]
  initPrompt: string | null
  tasks: RunnioTask[]
  activeView: 'workspace' | 'skills' | 'mcp'
  tasksViewMode: 'list' | 'board'

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

  // UI actions
  openAddProject: () => void
  closeAddProject: () => void
  openCreateAgent: () => void
  closeCreateAgent: () => void
  openSettings: () => void
  closeSettings: () => void
  toggleContextPanel: () => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  openQuickPrompt: () => void
  closeQuickPrompt: () => void

  // Toast
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void
  dismissToast: (id: string) => void

  // Prompt
  setInitPrompt: (prompt: string | null) => void

  // Tasks
  addTask: (task: Omit<RunnioTask, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (taskId: string, updates: Partial<RunnioTask>) => void
  removeTask: (taskId: string) => void
  moveTask: (taskId: string, newStatus: TaskStatus) => void

  // View
  setActiveView: (view: 'workspace' | 'skills' | 'mcp') => void
  setTasksViewMode: (mode: 'list' | 'board') => void

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
      isContextPanelOpen: false,
      isCreateAgentModalOpen: false,
      isAddProjectModalOpen: false,
      isSettingsOpen: false,
      isCommandPaletteOpen: false,
      isQuickPromptOpen: false,
      toasts: [],
      initPrompt: null,
      tasks: [],
      activeView: 'workspace' as const,
      tasksViewMode: 'list' as const,

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
              ? { ...p, agents: [...p.agents, agent] }
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

      updateAgent: (agentId, updates) => set(state => ({
        projects: state.projects.map(p => ({
          ...p,
          agents: p.agents.map(a =>
            a.id === agentId ? { ...a, ...updates } : a
          ),
        })),
      })),

      setActiveAgent: (agentId) => set({ activeAgentId: agentId, activeView: 'workspace' as const }),

      openAddProject: () => set({ isAddProjectModalOpen: true }),
      closeAddProject: () => set({ isAddProjectModalOpen: false }),
      openCreateAgent: () => set({ isCreateAgentModalOpen: true }),
      closeCreateAgent: () => set({ isCreateAgentModalOpen: false }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      toggleContextPanel: () => set(s => ({ isContextPanelOpen: !s.isContextPanelOpen })),
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      openQuickPrompt: () => set({ isQuickPromptOpen: true }),
      closeQuickPrompt: () => set({ isQuickPromptOpen: false }),

      showToast: (message, type = 'info') => {
        const id = Date.now().toString()
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => get().dismissToast(id), 3000)
      },
      dismissToast: (id) => set(s => ({
        toasts: s.toasts.filter(t => t.id !== id),
      })),

      setInitPrompt: (prompt) => set({ initPrompt: prompt }),

      addTask: (taskData) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const now = Date.now()
        set(s => ({
          tasks: [...s.tasks, { ...taskData, id, createdAt: now, updatedAt: now }],
        }))
      },

      updateTask: (taskId, updates) => set(s => ({
        tasks: s.tasks.map(t =>
          t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t
        ),
      })),

      removeTask: (taskId) => set(s => ({
        tasks: s.tasks.filter(t => t.id !== taskId),
      })),

      moveTask: (taskId, newStatus) => set(s => ({
        tasks: s.tasks.map(t =>
          t.id === taskId ? { ...t, status: newStatus, updatedAt: Date.now() } : t
        ),
      })),

      setActiveView: (view) => set({ activeView: view }),
      setTasksViewMode: (mode) => set({ tasksViewMode: mode }),

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
      getAllAgents: () => get().projects.flatMap(p => p.agents),
      getProjectById: (id) => get().projects.find(p => p.id === id) ?? null,
    }),
    {
      name: 'runnio-store',
      // Persist projects, active selections, and agent states
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        activeAgentId: state.activeAgentId,
        tasks: state.tasks,
        tasksViewMode: state.tasksViewMode,
      }),
    }
  )
)

// Alias for imperative access: store.getState().xxx()
export const store = useStore
