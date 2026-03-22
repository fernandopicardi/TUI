// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import { useEffect } from 'react'
import { useStore } from '../store/index'

/**
 * Listens for terminal:cost-update IPC events and pushes token usage into the store.
 * Should be mounted once at the App level.
 */
export function useCostTracker() {
  useEffect(() => {
    const unsub = window.runnio.terminal.onCostUpdate((terminalId, usage) => {
      // Find which agent owns this terminal
      const state = useStore.getState()
      for (const project of state.projects) {
        const agent = project.agents.find(a => a.terminalId === terminalId)
        if (agent) {
          state.updateAgent(agent.id, { tokenUsage: usage })
          break
        }
      }
    })
    return unsub
  }, [])
}
