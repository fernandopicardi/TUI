import { useState, useEffect, useRef, useCallback } from 'react'
import { store, AgentflowStore } from '../store/index'

/**
 * Simple React hook to subscribe to the Zustand store.
 * Re-renders only when the selected value changes (shallow compare).
 */
export function useStore<T>(selector: (state: AgentflowStore) => T): T {
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const [value, setValue] = useState(() => selector(store.getState()))

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      const next = selectorRef.current(state)
      setValue((prev) => Object.is(prev, next) ? prev : next)
    })
    return unsubscribe
  }, [])

  return value
}
