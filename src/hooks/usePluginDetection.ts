import { useState, useEffect } from 'react'
import { AgentflowPlugin, PluginContext } from '../plugins/types.js'
import { resolvePlugin, loadPluginSafe, rawPlugin } from '../plugins/registry.js'

export function usePluginDetection(rootPath: string) {
  const [plugin, setPlugin] = useState<AgentflowPlugin | null>(null)
  const [pluginContext, setPluginContext] = useState<PluginContext | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const detect = async () => {
      try {
        const resolved = await resolvePlugin(rootPath)
        if (cancelled) return
        setPlugin(resolved)

        const ctx = await loadPluginSafe(resolved, rootPath)
        if (cancelled) return

        if (ctx) {
          // If loadPluginSafe fell back to raw, update plugin ref
          if (ctx.pluginName !== resolved.name) {
            setPlugin(rawPlugin)
            setWarning(`Plugin "${resolved.name}" falhou ao carregar, usando fallback`)
          }
          setPluginContext(ctx)
        } else {
          setWarning(`Plugin "${resolved.name}" falhou ao carregar`)
        }
      } catch {
        if (!cancelled) {
          setWarning('Falha na detecção de plugins')
        }
      }
    }

    detect()
    return () => { cancelled = true }
  }, [rootPath])

  return { plugin, pluginContext, warning }
}
