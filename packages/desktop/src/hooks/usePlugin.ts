import { useEffect } from 'react'
import { useStore } from '../store/index'

/**
 * Loads plugin data for the active project if not already loaded.
 */
export function usePluginLoader() {
  const activeProject = useStore(s => {
    const p = s.projects.find(pr => pr.id === s.activeProjectId)
    return p ? { id: p.id, rootPath: p.rootPath, plugin: p.plugin, hasContext: !!p.pluginContext } : null
  })

  useEffect(() => {
    if (!activeProject || activeProject.hasContext || !window.agentflow?.plugins) return

    window.agentflow.plugins.load(activeProject.rootPath)
      .then(({ pluginName, context }) => {
        useStore.getState().updateProject(activeProject.id, {
          plugin: pluginName,
          pluginContext: context,
        })
      })
      .catch((err: unknown) => {
        console.error('[agentflow] plugin load failed:', err)
      })
  }, [activeProject?.id, activeProject?.hasContext])
}
