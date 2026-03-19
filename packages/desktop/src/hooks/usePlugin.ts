import { useEffect } from 'react'
import { store } from '../store/index'

/**
 * Loads plugin data via IPC when rootPath changes.
 */
export function usePluginLoader(rootPath: string | null) {
  useEffect(() => {
    if (!rootPath) return

    window.agentflow.plugins.load(rootPath).then(({ pluginName, context }) => {
      store.getState().setPlugin(pluginName, context)
    }).catch(() => {
      // Plugin load failed — not critical
    })
  }, [rootPath])
}
