import { useEffect, useRef } from 'react'
import { useStore } from '../store/index'

/**
 * Loads plugin data for the active project if not already loaded.
 * When plugin is 'raw', polls every 10s to re-detect after init completes.
 */
export function usePluginLoader() {
  const activeProject = useStore(s => {
    const p = s.projects.find(pr => pr.id === s.activeProjectId)
    return p ? { id: p.id, rootPath: p.rootPath, plugin: p.plugin, hasContext: !!p.pluginContext } : null
  })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initial load when no context yet
  useEffect(() => {
    if (!activeProject || activeProject.hasContext || !window.runnio?.plugins) return

    window.runnio.plugins.load(activeProject.rootPath)
      .then(({ pluginName, context }) => {
        useStore.getState().updateProject(activeProject.id, {
          plugin: pluginName,
          pluginContext: context,
        })
      })
      .catch((err: unknown) => {
        console.error('[runnio] plugin load failed:', err)
      })
  }, [activeProject?.id, activeProject?.hasContext])

  // Poll re-detection while plugin is 'raw' (init may be running)
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }

    if (!activeProject || activeProject.plugin !== 'raw' || !window.runnio?.plugins) return

    pollRef.current = setInterval(() => {
      window.runnio.plugins.load(activeProject.rootPath)
        .then(({ pluginName, context }) => {
          if (pluginName !== 'raw') {
            useStore.getState().updateProject(activeProject.id, {
              plugin: pluginName,
              pluginContext: context,
            })
            // Stop polling once detected
            if (pollRef.current) {
              clearInterval(pollRef.current)
              pollRef.current = null
            }
          }
        })
        .catch(() => { /* ignore poll errors */ })
    }, 10_000)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [activeProject?.id, activeProject?.plugin])
}
