import { useState, useEffect } from 'react'
import {
  RunnioPlugin,
  PluginContext,
  resolvePlugin,
  loadPluginSafe,
  rawPlugin,
} from '@runnio/core'

export function usePlugin(rootPath: string) {
  const [plugin, setPlugin] = useState<RunnioPlugin | null>(null)
  const [context, setContext] = useState<PluginContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
          if (ctx.pluginName !== resolved.name) {
            setPlugin(rawPlugin)
            setWarning(`Plugin "${resolved.name}" falhou ao carregar, usando fallback`)
          }
          setContext(ctx)
        } else {
          setWarning(`Plugin "${resolved.name}" falhou ao carregar`)
        }
      } catch {
        if (!cancelled) {
          setWarning('Falha na detecção de plugins')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    detect()
    return () => { cancelled = true }
  }, [rootPath])

  return { plugin, context, isLoading, warning }
}
