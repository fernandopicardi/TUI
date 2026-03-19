import * as React from 'react'
import { useEffect } from 'react'
import { useStore } from './hooks/useStore'
import { useAgentStatusWatcher } from './hooks/useAgentStatus'
import TitleBar from './components/TitleBar'
import Toast from './components/Toast'
import AgentBar from './components/AgentBar'
import Sidebar from './components/Sidebar'
import AddProjectModal from './components/AddProjectModal'
import CreateAgentModal from './components/CreateAgentModal'
import CommandPalette from './components/CommandPalette'
import QuickPrompt from './components/QuickPrompt'
import Welcome from './views/Welcome'
import Dashboard from './views/Dashboard'
import Workspace from './views/Workspace'

const App: React.FC = () => {
  const hydrated = useStore(s => s._hydrated)
  const projects = useStore(s => s.projects)
  const activeAgentId = useStore(s => s.activeAgentId)
  const toasts = useStore(s => s.toasts)
  const isAddProjectModalOpen = useStore(s => s.isAddProjectModalOpen)
  const isCreateAgentModalOpen = useStore(s => s.isCreateAgentModalOpen)
  const isCommandPaletteOpen = useStore(s => s.isCommandPaletteOpen)
  const isQuickPromptOpen = useStore(s => s.isQuickPromptOpen)
  const [preloadOk, setPreloadOk] = React.useState(false)

  // Poll agent statuses across all projects
  useAgentStatusWatcher()

  useEffect(() => {
    if (window.agentflow) setPreloadOk(true)
    else console.error('[agentflow] PRELOAD FAILED')
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement)?.matches?.('input,textarea')
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
        return
      }
      if (e.key === '?' && !e.ctrlKey && !isInput) {
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const hasProjects = projects.length > 0
  const hasActiveAgent = !!activeAgentId

  // Derive active project name for title bar
  const activeProject = useStore(s => s.projects.find(p => p.id === s.activeProjectId))
  const projectName = activeProject?.name

  // Collect all agents that have been activated (have a terminalId) for persistent mounting
  const allAgents = projects.flatMap(p => p.agents)

  return React.createElement('div', {
    style: {
      display: 'flex', flexDirection: 'column' as const, height: '100vh',
      backgroundColor: '#0a0a0a', color: '#ededed',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize: '14px', overflow: 'hidden',
    },
  },
    React.createElement(TitleBar, { projectName }),

    // Preload error
    !preloadOk
      ? React.createElement('div', {
          style: { padding: '12px 16px', backgroundColor: '#1a0000', borderBottom: '1px solid #ef4444', color: '#ef4444', fontSize: '12px' },
        }, 'Error: preload failed. Restart the app.')
      : null,

    // Wait for persist hydration before rendering content
    !hydrated
      ? React.createElement('div', {
          style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        },
          React.createElement('div', {
            style: { color: '#555', fontSize: '13px' },
          }, 'Loading...')
        )
      : hasProjects
        ? React.createElement(React.Fragment, null,
            // Agent Bar (horizontal, all agents across projects)
            React.createElement(AgentBar),

            // Content area: Sidebar + Main
            React.createElement('div', {
              style: { display: 'flex', flex: 1, overflow: 'hidden' },
            },
              React.createElement(Sidebar),
              React.createElement('main', {
                style: { flex: 1, overflow: 'hidden', position: 'relative' as const },
              },
                // Dashboard — visible when no agent selected
                React.createElement('div', {
                  style: {
                    position: 'absolute' as const, inset: 0,
                    display: hasActiveAgent ? 'none' : 'block',
                    overflow: 'auto' as const,
                  },
                },
                  React.createElement(Dashboard)
                ),

                // Workspace per agent — keep ALL mounted to preserve terminal sessions
                // Only the active one is visible; others are hidden but alive
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

    // Toasts
    ...toasts.map(t =>
      React.createElement(Toast, {
        key: t.id, message: t.message, type: t.type,
        onDismiss: () => useStore.getState().dismissToast(t.id),
      })
    ),

    // Modals
    isAddProjectModalOpen ? React.createElement(AddProjectModal) : null,
    isCreateAgentModalOpen ? React.createElement(CreateAgentModal) : null,
    isCommandPaletteOpen ? React.createElement(CommandPalette) : null,
    isQuickPromptOpen ? React.createElement(QuickPrompt) : null,
  )
}

export default App
