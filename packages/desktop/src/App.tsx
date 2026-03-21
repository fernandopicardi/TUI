// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useEffect } from 'react'
import { useStore } from './hooks/useStore'
import { Theme, applyTheme } from './styles/themes'
import { useAgentStatusWatcher } from './hooks/useAgentStatus'
import { useWorktreeSync } from './hooks/useWorktreeSync'
import TitleBar from './components/TitleBar'
import Toast from './components/Toast'
import AgentBar from './components/AgentBar'
import Sidebar from './components/Sidebar'
import AddProjectModal from './components/AddProjectModal'
import CreateAgentModal from './components/CreateAgentModal'
import CommandPalette from './components/CommandPalette'
import QuickPrompt from './components/QuickPrompt'
import SettingsModal from './components/SettingsModal'
import DeleteAgentModal from './components/DeleteAgentModal'
import Welcome from './views/Welcome'
import Dashboard from './views/Dashboard'
import Workspace from './views/Workspace'

const App: React.FC = () => {
  const [hydrated, setHydrated] = React.useState(false)
  useEffect(() => {
    const persistApi = (useStore as any).persist
    if (persistApi && typeof persistApi.hasHydrated === 'function') {
      if (persistApi.hasHydrated()) {
        setHydrated(true)
      } else if (typeof persistApi.onFinishHydration === 'function') {
        persistApi.onFinishHydration(() => setHydrated(true))
      } else {
        setTimeout(() => setHydrated(true), 0)
      }
    } else {
      setTimeout(() => setHydrated(true), 0)
    }
  }, [])

  const projects = useStore(s => s.projects)
  const activeAgentId = useStore(s => s.activeAgentId)
  const toasts = useStore(s => s.toasts)
  const isAddProjectModalOpen = useStore(s => s.isAddProjectModalOpen)
  const isCreateAgentModalOpen = useStore(s => s.isCreateAgentModalOpen)
  const isCommandPaletteOpen = useStore(s => s.isCommandPaletteOpen)
  const isQuickPromptOpen = useStore(s => s.isQuickPromptOpen)
  const isSettingsOpen = useStore(s => s.isSettingsOpen)
  const isDeleteAgentModalOpen = useStore(s => s.isDeleteAgentModalOpen)
  const [preloadOk, setPreloadOk] = React.useState(false)

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = (useStore.getState().theme as Theme) ?? 'dark'
    applyTheme(savedTheme)

    if (savedTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  // Poll agent statuses across all projects
  useAgentStatusWatcher()

  // Watch for external worktree changes
  useWorktreeSync()

  useEffect(() => {
    if (window.runnio) setPreloadOk(true)
    else console.error('[runnio] PRELOAD FAILED')
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = useStore.getState()

      if (e.ctrlKey && e.shiftKey && e.key === 'P') { e.preventDefault(); s.openAddProject(); return }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); s.openCreateAgent(); return }
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); s.openCommandPalette(); return }
      if (e.ctrlKey && e.code === 'Space') { e.preventDefault(); s.openQuickPrompt(); return }
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); s.toggleContextPanel(); return }
      if (e.ctrlKey && e.key === ',') { e.preventDefault(); s.openSettings(); return }
      if (e.ctrlKey && e.key === 'w') { e.preventDefault(); s.setActiveAgent(null); return }
      if (e.key === 'Escape') {
        s.closeAddProject()
        s.closeCreateAgent()
        s.closeCommandPalette()
        s.closeQuickPrompt()
        s.closeSettings()
        s.closeDeleteAgent()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const hasProjects = projects.length > 0
  const hasActiveAgent = !!activeAgentId
  const activeProject = useStore(s => s.projects.find(p => p.id === s.activeProjectId))
  const projectName = activeProject?.name
  const allAgents = projects.flatMap(p => p.agents)

  return React.createElement('div', {
    style: {
      display: 'flex', flexDirection: 'column' as const, height: '100vh',
      backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize: 'var(--text-md)', overflow: 'hidden',
    },
  },
    React.createElement(TitleBar, { projectName }),

    !preloadOk
      ? React.createElement('div', {
          style: { padding: '12px 16px', backgroundColor: '#1a0000', borderBottom: '1px solid var(--error)', color: 'var(--error)', fontSize: 'var(--text-sm)' },
        }, 'Error: preload failed. Restart the app.')
      : null,

    // Wait for persist hydration
    !hydrated
      ? React.createElement('div', {
          style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        },
          React.createElement('span', {
            style: {
              fontSize: '24px',
              background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'pulse 1.5s infinite',
            } as React.CSSProperties,
          }, '\u25C6'),
        )
      : hasProjects
        ? React.createElement(React.Fragment, null,
            React.createElement(AgentBar),
            React.createElement('div', {
              style: { display: 'flex', flex: 1, overflow: 'hidden' },
            },
              React.createElement(Sidebar),
              React.createElement('main', {
                style: { flex: 1, overflow: 'hidden', position: 'relative' as const },
              },
                // Dashboard
                React.createElement('div', {
                  style: {
                    position: 'absolute' as const, inset: 0,
                    display: hasActiveAgent ? 'none' : 'block',
                    overflow: 'auto' as const,
                  },
                },
                  React.createElement(Dashboard)
                ),
                // Workspaces — keep ALL mounted to preserve terminal sessions
                ...allAgents.map(agent =>
                  React.createElement('div', {
                    key: agent.id,
                    style: {
                      position: 'absolute' as const, inset: 0,
                      display: agent.id === activeAgentId ? 'flex' : 'none',
                      flexDirection: 'column' as const,
                    },
                  },
                    React.createElement(Workspace, { agentId: agent.id })
                  )
                ),
              ),
            )
          )
        : React.createElement(Welcome),

    // Toasts — stacked
    ...toasts.map((t, i) =>
      React.createElement(Toast, {
        key: t.id, message: t.message, type: t.type, index: i,
        onDismiss: () => useStore.getState().dismissToast(t.id),
      })
    ),

    // Modals
    isAddProjectModalOpen ? React.createElement(AddProjectModal) : null,
    isCreateAgentModalOpen ? React.createElement(CreateAgentModal) : null,
    isCommandPaletteOpen ? React.createElement(CommandPalette) : null,
    isQuickPromptOpen ? React.createElement(QuickPrompt) : null,
    isSettingsOpen ? React.createElement(SettingsModal) : null,
    isDeleteAgentModalOpen ? React.createElement(DeleteAgentModal) : null,
  )
}

export default App
