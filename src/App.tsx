import * as React from 'react'
import { useState, useCallback } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import TextInput from 'ink-text-input'
import { useWorktrees } from './hooks/useWorktrees.js'
import { useAgentStatus } from './hooks/useAgentStatus.js'
import { usePluginDetection } from './hooks/usePluginDetection.js'
import { useConfig } from './hooks/useConfig.js'
import { createGit, addWorktree, removeWorktree, getRepoName } from './utils/git.js'
import { resolvePath, getBasename, getDirname } from './utils/paths.js'
import WorkspaceList from './components/WorkspaceList.js'
import ContextPanel from './components/ContextPanel.js'
import HelpBar from './components/HelpBar.js'
import { openWorkspace } from './actions/openWorkspace.js'

type AppMode = 'list' | 'creating' | 'confirm-delete'

interface Props {
  rootPath: string
}

const App: React.FC<Props> = ({ rootPath }) => {
  const config = useConfig(rootPath)
  const { worktrees, error } = useWorktrees(rootPath, config.refreshInterval)
  const statuses = useAgentStatus(worktrees)
  const { plugin, pluginContext } = usePluginDetection(rootPath)
  const { exit } = useApp()

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mode, setMode] = useState<AppMode>('list')
  const [newBranchName, setNewBranchName] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(''), 3000)
  }, [])

  useInput((input, key) => {
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
          const git = createGit(rootPath)
          removeWorktree(git, wt.path)
            .then(() => showStatus(`Worktree "${wt.branch}" removido`))
            .catch((err: Error) => showStatus(`Erro: ${err.message}`))
        }
        setMode('list')
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
        openWorkspace(wt.path, config.terminal)
          .then(() => showStatus(`Abrindo ${wt.branch}...`))
          .catch(() => showStatus(`Não foi possível abrir terminal`))
      }
    } else if (input === 'n') {
      setMode('creating')
      setNewBranchName('')
    } else if (input === 'd') {
      const wt = worktrees[selectedIndex]
      if (wt && !wt.isMain) {
        setMode('confirm-delete')
      } else {
        showStatus('Não é possível deletar o worktree principal')
      }
    } else if (input === 'r') {
      showStatus('Refresh...')
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

    try {
      const git = createGit(rootPath)
      const repoName = await getRepoName(git)
      const parentDir = getDirname(rootPath)
      const worktreePath = resolvePath(parentDir, `${repoName}-${branchName}`)

      await addWorktree(git, worktreePath, branchName)
      showStatus(`Worktree "${branchName}" criado`)

      openWorkspace(worktreePath, config.terminal).catch(() => {})
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      showStatus(`Erro: ${message}`)
    }

    setMode('list')
    setNewBranchName('')
  }, [rootPath, config.terminal, showStatus])

  if (error) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { color: 'red' }, `Erro: ${error}`),
      React.createElement(Text, { dimColor: true }, 'Verifique se está dentro de um repositório git.')
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

    // Context panel
    React.createElement(ContextPanel, { plugin, context: pluginContext }),

    // Workspace list
    React.createElement(WorkspaceList, {
      worktrees,
      statuses,
      selectedIndex,
    }),

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
          React.createElement(
            Text,
            { color: 'yellow' },
            `Deletar "${worktrees[selectedIndex].branch}"? [s/n]`
          )
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
