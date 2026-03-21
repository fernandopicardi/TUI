// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Project, AgentSession, Toast } from '../types'
import { canAddProject, canAddAgent, PLAN_FLAGS } from '../features'
import { Theme } from '../styles/themes'

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

  // Default launch settings
  defaultModel: string
  defaultMode: 'normal' | 'plan' | 'auto'
  setDefaultModel: (model: string) => void
  setDefaultMode: (mode: 'normal' | 'plan' | 'auto') => void

  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

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
  openDeleteAgent: (projectId: string, agentId: string) => void
  closeDeleteAgent: () => void

  // Toast
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void
  dismissToast: (id: string) => void

  // Prompt
  setInitPrompt: (prompt: string | null) => void

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
      isDeleteAgentModalOpen: false,
      deleteAgentTarget: null,
      toasts: [],
      initPrompt: null,
      defaultModel: 'claude-sonnet-4-5',
      defaultMode: 'normal' as 'normal' | 'plan' | 'auto',
      theme: 'dark' as Theme,

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

      updateAgent: (agentId, updates) => set(state => ({
        projects: state.projects.map(p => ({
          ...p,
          agents: p.agents.map(a =>
            a.id === agentId ? { ...a, ...updates } : a
          ),
        })),
      })),

      setActiveAgent: (agentId) => set({ activeAgentId: agentId }),

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

      setDefaultModel: (model) => set({ defaultModel: model }),
      setDefaultMode: (mode) => set({ defaultMode: mode }),
      setTheme: (theme) => set({ theme }),

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
        defaultModel: state.defaultModel,
        defaultMode: state.defaultMode,
        theme: state.theme,
      }),
      // Migrate persisted agents that predate the hasLaunched field
      merge: (persisted: any, current: any) => {
        const merged = { ...current, ...(persisted as object) }
        if (merged.projects) {
          merged.projects = merged.projects.map((p: any) => ({
            ...p,
            agents: (p.agents || []).map((a: any) => ({
              ...a,
              hasLaunched: a.hasLaunched ?? true, // existing agents already launched
            })),
          }))
        }
        return merged
      },
    }
  )
)

// Alias for imperative access: store.getState().xxx()
export const store = useStore
