import { useState, useEffect } from 'react'
import { store, AgentflowStore } from '../store/index'

/**
 * Simple React hook to subscribe to the Zustand store.
 * Re-renders when the selected slice changes.
 */
export function useStore<T>(selector: (state: AgentflowStore) => T): T {
  const [value, setValue] = useState(() => selector(store.getState()))

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      const next = selector(state)
      setValue(next)
    })
    return unsubscribe
  }, [selector])

  return value
}

export function useStoreActions() {
  return store.getState()
}
