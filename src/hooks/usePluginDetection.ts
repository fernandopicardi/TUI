import { useState, useEffect } from 'react'
import { AgentflowPlugin, PluginContext } from '../plugins/types.js'
import { resolvePlugin } from '../plugins/registry.js'

export function usePluginDetection(rootPath: string) {
  const [plugin, setPlugin] = useState<AgentflowPlugin | null>(null)
  const [pluginContext, setPluginContext] = useState<PluginContext | null>(null)

  useEffect(() => {
    let cancelled = false

    const detect = async () => {
      try {
        const resolved = await resolvePlugin(rootPath)
        if (cancelled) return
        setPlugin(resolved)

        const ctx = await resolved.load(rootPath)
        if (cancelled) return
        setPluginContext(ctx)
      } catch {
        // If detection fails, leave plugin as null
      }
    }

    detect()
    return () => { cancelled = true }
  }, [rootPath])

  return { plugin, pluginContext }
}
