import * as React from 'react'
import { useReducer, useCallback, useRef } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import Spinner from 'ink-spinner'
import TextInput from 'ink-text-input'
import {
  loadConfig,
  createWorktree,
  removeWorktree,
  RunnioConfig,
  DEFAULT_CONFIG,
} from '@runnio/core'
import { useWorktrees } from './hooks/useWorktrees.js'
import { useAgentStatus } from './hooks/useAgentStatus.js'
import { usePlugin } from './hooks/usePlugin.js'
import WorkspaceList from './components/WorkspaceList.js'
import ContextPanel from './components/ContextPanel.js'
import HelpBar from './components/HelpBar.js'
import { openInTerminal } from './utils/terminal.js'

type AppMode = 'list' | 'creating' | 'confirm-delete' | 'busy'

interface AppState {
  selectedIndex: number
  mode: AppMode
  newBranchName: string
  error: string | null
  statusMessage: string
  busyMessage: string
}

type AppAction =
  | { type: 'SELECT'; index: number }
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'SET_BRANCH_NAME'; name: string }
  | { type: 'SET_STATUS'; message: string }
  | { type: 'SET_BUSY'; message: string }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET_CREATE' }

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT':
      return { ...state, selectedIndex: action.index }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_BRANCH_NAME':
      return { ...state, newBranchName: action.name }
    case 'SET_STATUS':
      return { ...state, statusMessage: action.message }
    case 'SET_BUSY':
      return { ...state, mode: 'busy', busyMessage: action.message }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'RESET_CREATE':
      return { ...state, mode: 'list', newBranchName: '', busyMessage: '' }
    default:
      return state
  }
}

interface Props {
  rootPath: string
  config: RunnioConfig
}

const App: React.FC<Props> = ({ rootPath, config }) => {
  const { worktrees, isLoading, error: wtError, refresh } = useWorktrees(rootPath, config.refreshInterval)
  const { statuses, lastModifiedMap } = useAgentStatus(worktrees)
  const { plugin, context, warning: pluginWarning } = usePlugin(rootPath)
  const { exit } = useApp()

  const [state, dispatch] = useReducer(reducer, {
    selectedIndex: 0,
    mode: 'list' as AppMode,
    newBranchName: '',
    error: null,
    statusMessage: '',
    busyMessage: '',
  })

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showStatus = useCallback((msg: string, durationMs = 3000) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    dispatch({ type: 'SET_STATUS', message: msg })
    statusTimerRef.current = setTimeout(() => dispatch({ type: 'SET_STATUS', message: '' }), durationMs)
  }, [])

  useInput((input, key) => {
    if (state.mode === 'busy') return

    if (state.mode === 'creating') {
      if (key.escape) {
        dispatch({ type: 'RESET_CREATE' })
      }
      return
    }

    if (state.mode === 'confirm-delete') {
      if (input === 's' || input === 'S' || input === 'y' || input === 'Y') {
        const wt = worktrees[state.selectedIndex]
        if (wt && !wt.isMain) {
          dispatch({ type: 'SET_BUSY', message: `Removendo "${wt.branch}"...` })
          removeWorktree(rootPath, wt.path)
            .then(() => {
              showStatus(`Worktree "${wt.branch}" removido`)
              refresh()
            })
            .catch((err: Error) => showStatus(`Erro: ${err.message}`))
            .finally(() => dispatch({ type: 'RESET_CREATE' }))
        } else {
          dispatch({ type: 'SET_MODE', mode: 'list' })
        }
      } else if (input === 'n' || input === 'N' || key.escape) {
        dispatch({ type: 'SET_MODE', mode: 'list' })
      }
      return
    }

    // List mode
    if (key.upArrow) {
      dispatch({ type: 'SELECT', index: Math.max(0, state.selectedIndex - 1) })
    } else if (key.downArrow) {
      dispatch({ type: 'SELECT', index: Math.min(worktrees.length - 1, state.selectedIndex + 1) })
    } else if (key.return) {
      const wt = worktrees[state.selectedIndex]
      if (wt) {
        const openCommand = config.openCommand || DEFAULT_CONFIG.openCommand || 'claude'
        openInTerminal(wt.path, openCommand, config.terminal)
          .then(result => showStatus(result.message))
      }
    } else if (input === 'n') {
      dispatch({ type: 'SET_MODE', mode: 'creating' })
      dispatch({ type: 'SET_BRANCH_NAME', name: '' })
    } else if (input === 'd') {
      const wt = worktrees[state.selectedIndex]
      if (wt && !wt.isMain) {
        dispatch({ type: 'SET_MODE', mode: 'confirm-delete' })
      } else if (wt?.isMain) {
        showStatus('N\u00E3o \u00E9 poss\u00EDvel deletar o worktree principal')
      }
    } else if (input === 'r') {
      refresh()
      showStatus('Refresh...', 1500)
    } else if (input === 'q') {
      exit()
    }
  })

  const handleCreateSubmit = useCallback(async (value: string) => {
    const branchName = value.trim().replace(/\s+/g, '-').toLowerCase()
    if (!branchName) {
      dispatch({ type: 'RESET_CREATE' })
      return
    }

    dispatch({ type: 'SET_BUSY', message: 'Criando branch...' })

    try {
      const wt = await createWorktree(rootPath, branchName)
      dispatch({ type: 'SET_BUSY', message: 'Abrindo terminal...' })

      const openCommand = config.openCommand || DEFAULT_CONFIG.openCommand || 'claude'
      const result = await openInTerminal(wt.path, openCommand, config.terminal)
      showStatus(result.success ? `Worktree "${branchName}" criado \u2014 ${result.message}` : result.message)
      refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showStatus(`Erro: ${message}`)
    }

    dispatch({ type: 'RESET_CREATE' })
  }, [rootPath, config.terminal, config.openCommand, showStatus, refresh])

  // Loading state
  if (isLoading) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true, color: 'cyan' }, '\u2B21 Runnio'),
      React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(Spinner, { type: 'dots' }),
        React.createElement(Text, null, ' Detectando worktrees...')
      )
    )
  }

  // Error state
  if (wtError) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true, color: 'cyan' }, '\u2B21 Runnio'),
      React.createElement(Text, null, ''),
      React.createElement(Text, { color: 'red' }, `Erro: ${wtError}`),
      React.createElement(Text, { dimColor: true }, 'Verifique se est\u00E1 dentro de um reposit\u00F3rio git.'),
      React.createElement(Box, { marginTop: 1 }, React.createElement(Text, { dimColor: true }, '[q] sair'))
    )
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    // Header
    React.createElement(Text, { bold: true, color: 'cyan' }, '\u2B21 Runnio'),
    React.createElement(Text, null, ''),

    // Plugin warning
    pluginWarning
      ? React.createElement(Text, { color: 'yellow' }, `\u26A0 ${pluginWarning}`)
      : null,

    // Context panel
    React.createElement(ContextPanel, { pluginName: plugin?.name || null, context }),

    // Workspace list
    React.createElement(WorkspaceList, {
      worktrees,
      statuses,
      selectedIndex: state.selectedIndex,
      maxVisible: config.maxVisibleWorkspaces ?? 8,
      showTimestamps: config.showTimestamps ?? true,
      lastModifiedMap,
    }),

    // Busy mode
    state.mode === 'busy'
      ? React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(Spinner, { type: 'dots' }),
          React.createElement(Text, null, ` ${state.busyMessage}`)
        )
      : null,

    // Create mode
    state.mode === 'creating'
      ? React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(Text, null, 'Nome do branch: '),
          React.createElement(TextInput, {
            value: state.newBranchName,
            onChange: (v: string) => dispatch({ type: 'SET_BRANCH_NAME', name: v }),
            onSubmit: handleCreateSubmit,
          })
        )
      : null,

    // Delete confirmation
    state.mode === 'confirm-delete' && worktrees[state.selectedIndex]
      ? React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(Text, null, 'Deletar "'),
          React.createElement(Text, { bold: true, color: 'red' }, worktrees[state.selectedIndex].branch),
          React.createElement(Text, null, '"? [s/n]')
        )
      : null,

    // Status message
    state.statusMessage
      ? React.createElement(Box, { marginTop: 1 }, React.createElement(Text, { color: 'green' }, state.statusMessage))
      : null,

    // Help bar
    React.createElement(HelpBar)
  )
}

export default App
