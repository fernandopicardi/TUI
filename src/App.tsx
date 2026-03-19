import * as React from 'react'
import { useState, useCallback, useRef } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import Spinner from 'ink-spinner'
import TextInput from 'ink-text-input'
import { useWorktrees } from './hooks/useWorktrees.js'
import { useAgentStatus } from './hooks/useAgentStatus.js'
import { usePluginDetection } from './hooks/usePluginDetection.js'
import { useConfig } from './hooks/useConfig.js'
import { createGit, addWorktree, removeWorktree, getRepoName } from './utils/git.js'
import { resolvePath, getDirname } from './utils/paths.js'
import WorkspaceList from './components/WorkspaceList.js'
import ContextPanel from './components/ContextPanel.js'
import HelpBar from './components/HelpBar.js'
import { openWorkspace } from './actions/openWorkspace.js'

type AppMode = 'list' | 'creating' | 'confirm-delete' | 'busy'

interface Props {
  rootPath: string
}

const App: React.FC<Props> = ({ rootPath }) => {
  const config = useConfig(rootPath)
  const { worktrees, loading, error, refresh } = useWorktrees(rootPath, config.refreshInterval)
  const statuses = useAgentStatus(worktrees)
  const { plugin, pluginContext, warning: pluginWarning } = usePluginDetection(rootPath)
  const { exit } = useApp()

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mode, setMode] = useState<AppMode>('list')
  const [newBranchName, setNewBranchName] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [busyMessage, setBusyMessage] = useState('')
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track last modified times from chokidar (passed to WorkspaceList for timestamps)
  const lastModifiedMapRef = useRef<Record<string, number>>({})
  // Update on status changes
  for (const wt of worktrees) {
    if (statuses[wt.path] === 'working') {
      lastModifiedMapRef.current[wt.path] = Date.now()
    }
  }

  const showStatus = useCallback((msg: string, durationMs = 3000) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    setStatusMessage(msg)
    statusTimerRef.current = setTimeout(() => setStatusMessage(''), durationMs)
  }, [])

  useInput((input, key) => {
    if (mode === 'busy') return

    if (mode === 'creating') {
      if (key.escape) {
        setMode('list')
        setNewBranchName('')
      }
      return
    }

    if (mode === 'confirm-delete') {
      if (input === 's' || input === 'S' || input === 'y' || input === 'Y') {
        const wt = worktrees[selectedIndex]
        if (wt && !wt.isMain) {
          setMode('busy')
          setBusyMessage(`Removendo "${wt.branch}"...`)
          const git = createGit(rootPath)
          removeWorktree(git, wt.path)
            .then(() => {
              showStatus(`Worktree "${wt.branch}" removido`)
              refresh()
            })
            .catch((err: Error) => showStatus(`Erro: ${err.message}`))
            .finally(() => {
              setMode('list')
              setBusyMessage('')
            })
        } else {
          setMode('list')
        }
      } else if (input === 'n' || input === 'N' || key.escape) {
        setMode('list')
      }
      return
    }

    // List mode
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1))
    } else if (key.downArrow) {
      setSelectedIndex(i => Math.min(worktrees.length - 1, i + 1))
    } else if (key.return) {
      const wt = worktrees[selectedIndex]
      if (wt) {
        if (!wt.existsOnDisk) {
          showStatus('Este worktree não existe mais no disco. Use [d] para removê-lo.')
          return
        }
        openWorkspace(wt.path, config.terminal, config.openCommand)
          .then(result => showStatus(result.message))
      }
    } else if (input === 'n') {
      setMode('creating')
      setNewBranchName('')
    } else if (input === 'd') {
      const wt = worktrees[selectedIndex]
      if (wt && !wt.isMain) {
        setMode('confirm-delete')
      } else if (wt?.isMain) {
        showStatus('Não é possível deletar o worktree principal')
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
      setMode('list')
      return
    }

    setMode('busy')
    setBusyMessage('Criando branch...')

    try {
      const git = createGit(rootPath)
      const repoName = await getRepoName(git)
      const parentDir = getDirname(rootPath)
      const worktreePath = resolvePath(parentDir, `${repoName}-${branchName}`)

      await addWorktree(git, worktreePath, branchName)
      setBusyMessage('Abrindo terminal...')

      const result = await openWorkspace(worktreePath, config.terminal, config.openCommand)
      showStatus(result.success ? `Worktree "${branchName}" criado — ${result.message}` : result.message)
      refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showStatus(`Erro: ${message}`)
    }

    setMode('list')
    setBusyMessage('')
    setNewBranchName('')
  }, [rootPath, config.terminal, config.openCommand, showStatus, refresh])

  // Loading state
  if (loading) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(
        Text,
        { bold: true, color: 'cyan' },
        '⬡ agentflow'
      ),
      React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(Spinner, { type: 'dots' }),
        React.createElement(Text, null, ' Detectando worktrees...')
      )
    )
  }

  // Error state
  if (error) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { bold: true, color: 'cyan' }, '⬡ agentflow'),
      React.createElement(Text, null, ''),
      React.createElement(Text, { color: 'red' }, `Erro: ${error}`),
      React.createElement(Text, { dimColor: true }, 'Verifique se está dentro de um repositório git.'),
      React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(Text, { dimColor: true }, '[q] sair')
      )
    )
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    // Header
    React.createElement(
      Text,
      { bold: true, color: 'cyan' },
      '⬡ agentflow'
    ),
    React.createElement(Text, null, ''),

    // Plugin warning
    pluginWarning
      ? React.createElement(
          Text,
          { color: 'yellow' },
          `⚠ ${pluginWarning}`
        )
      : null,

    // Context panel
    React.createElement(ContextPanel, { plugin, context: pluginContext }),

    // Workspace list
    React.createElement(WorkspaceList, {
      worktrees,
      statuses,
      selectedIndex,
      maxVisible: config.maxVisibleWorkspaces ?? 8,
      showTimestamps: config.showTimestamps ?? true,
      lastModifiedMap: lastModifiedMapRef.current,
    }),

    // Busy mode (creating/deleting)
    mode === 'busy'
      ? React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(Spinner, { type: 'dots' }),
          React.createElement(Text, null, ` ${busyMessage}`)
        )
      : null,

    // Create mode
    mode === 'creating'
      ? React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(Text, null, 'Nome do branch: '),
          React.createElement(TextInput, {
            value: newBranchName,
            onChange: setNewBranchName,
            onSubmit: handleCreateSubmit,
          })
        )
      : null,

    // Delete confirmation
    mode === 'confirm-delete' && worktrees[selectedIndex]
      ? React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(Text, null, 'Deletar "'),
          React.createElement(Text, { bold: true, color: 'red' }, worktrees[selectedIndex].branch),
          React.createElement(Text, null, '"? [s/n]')
        )
      : null,

    // Status message
    statusMessage
      ? React.createElement(
          Box,
          { marginTop: 1 },
          React.createElement(Text, { color: 'green' }, statusMessage)
        )
      : null,

    // Help bar
    React.createElement(HelpBar)
  )
}

export default App
