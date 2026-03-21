// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../hooks/useStore'

interface Props {
  worktreePath: string
  rootPath: string
  activeTab: 'changes' | 'files' | 'info'
  pluginName?: string
  pluginContext?: any
}

interface GitFileStatus {
  path: string
  status: string
}

const RightPanel: React.FC<Props> = ({ worktreePath, rootPath, activeTab, pluginName, pluginContext }) => {
  const [changedFiles, setChangedFiles] = useState<GitFileStatus[]>([])
  const [loading, setLoading] = useState(false)
  const setRightPanelTab = useStore(s => s.setRightPanelTab)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileTree, setFileTree] = useState<any[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [savedIndicator, setSavedIndicator] = useState(false)
  const saveTimerRef = useRef<any>(null)

  // Fetch git status for Changes tab
  const fetchStatus = useCallback(async () => {
    if (!worktreePath) return
    try {
      const result = await window.runnio.git.status(worktreePath)
      if (result.success) {
        setChangedFiles(result.files)
      }
    } catch (err) {
      console.error('[runnio] RightPanel status error:', err)
    }
  }, [worktreePath])

  // Poll git status every 5s while Changes tab is open
  useEffect(() => {
    if (activeTab !== 'changes') return
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [activeTab, fetchStatus])

  // Fetch file tree for Files tab
  useEffect(() => {
    if (activeTab !== 'files') return
    const fetch = async () => {
      try {
        const tree = await window.runnio.files.list(worktreePath)
        setFileTree(tree)
      } catch {}
    }
    fetch()
  }, [activeTab, worktreePath])

  // Load file content when selected
  useEffect(() => {
    if (!selectedFile) {
      setFileContent(null)
      return
    }
    const load = async () => {
      try {
        const fullPath = worktreePath.replace(/\\/g, '/') + '/' + selectedFile
        const result = await window.runnio.files.read(fullPath)
        if (result.success && !result.binary) {
          setFileContent(result.content ?? '')
        } else {
          setFileContent(null)
        }
      } catch {}
    }
    load()
  }, [selectedFile, worktreePath])

  const handleStageAll = useCallback(async () => {
    setLoading(true)
    try {
      await window.runnio.git.stageAll(worktreePath)
      await fetchStatus()
      useStore.getState().showToast('All files staged', 'success')
    } catch {
      useStore.getState().showToast('Failed to stage files', 'warning')
    }
    setLoading(false)
  }, [worktreePath, fetchStatus])

  const handleFileClick = useCallback((filePath: string) => {
    setSelectedFile(filePath)
    setRightPanelTab('files')
  }, [setRightPanelTab])

  const handleCreatePR = useCallback(() => {
    // Switch to PR tab in main workspace — this is handled by the parent
    // We need to communicate this up, but for now just show a toast
    useStore.getState().showToast('Switch to PR tab in workspace', 'info')
  }, [])

  const handleSaveFile = useCallback(async (content: string) => {
    if (!selectedFile) return
    try {
      const fullPath = worktreePath.replace(/\\/g, '/') + '/' + selectedFile
      await window.runnio.files.write(fullPath, content)
      setSavedIndicator(true)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => setSavedIndicator(false), 2000)
    } catch {}
  }, [selectedFile, worktreePath])

  const toggleDir = useCallback((dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dirPath)) next.delete(dirPath)
      else next.add(dirPath)
      return next
    })
  }, [])

  const statusColor = (status: string) => {
    switch (status) {
      case 'M': return 'var(--waiting)'
      case 'A': return 'var(--working)'
      case 'D': return 'var(--error)'
      case '?': return 'var(--text-tertiary)'
      default: return 'var(--text-secondary)'
    }
  }

  const tabStyle = (tab: 'changes' | 'files' | 'info'): React.CSSProperties => ({
    background: 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    padding: '6px 12px',
    cursor: 'pointer',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    flex: 1,
    textAlign: 'center' as const,
  })

  // Group changed files by status
  const grouped = changedFiles.reduce((acc, f) => {
    const key = f.status === 'M' ? 'Modified' : f.status === 'A' ? 'Added' : f.status === 'D' ? 'Deleted' : 'Untracked'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {} as Record<string, GitFileStatus[]>)

  // Get project agents info for Info tab
  const project = useStore(s => s.projects.find(p => p.rootPath === rootPath))
  const agents = project?.agents ?? []
  const workingCount = agents.filter(a => a.status === 'working').length
  const waitingCount = agents.filter(a => a.status === 'waiting').length
  const idleCount = agents.filter(a => a.status === 'idle').length

  // Render file tree (compact, for right panel)
  const renderFileTree = (entries: any[], depth: number = 0): React.ReactElement[] => {
    const result: React.ReactElement[] = []
    for (const entry of entries) {
      if (entry.type === 'directory') {
        const isExpanded = expandedDirs.has(entry.path)
        result.push(
          React.createElement('div', {
            key: entry.path,
            style: { paddingLeft: `${depth * 12}px` },
          },
            React.createElement('div', {
              onClick: () => toggleDir(entry.path),
              style: {
                padding: '2px 4px', cursor: 'pointer', fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px',
              },
              onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)' },
              onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.backgroundColor = 'transparent' },
            },
              React.createElement('span', { style: { fontSize: '10px', width: '12px' } }, isExpanded ? '\u25BC' : '\u25B6'),
              React.createElement('span', null, entry.name),
            ),
            isExpanded && entry.children ? renderFileTree(entry.children, depth + 1) : null,
          )
        )
      } else {
        result.push(
          React.createElement('div', {
            key: entry.path,
            onClick: () => handleFileClick(entry.path),
            style: {
              padding: '2px 4px', paddingLeft: `${depth * 12 + 16}px`,
              cursor: 'pointer', fontSize: 'var(--text-sm)',
              color: selectedFile === entry.path ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: selectedFile === entry.path ? 'var(--bg-selected)' : 'transparent',
            },
            onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
              if (selectedFile !== entry.path) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
            },
            onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
              if (selectedFile !== entry.path) e.currentTarget.style.backgroundColor = 'transparent'
            },
          },
            React.createElement('span', { style: { color: statusColor(entry.gitStatus || '') } },
              entry.gitStatus ? `${entry.gitStatus} ` : ''
            ),
            entry.name,
          )
        )
      }
    }
    return result
  }

  return React.createElement('div', {
    style: {
      width: '280px',
      minWidth: '280px',
      height: '100%',
      borderLeft: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-surface)',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
  },
    // Tab bar
    React.createElement('div', {
      style: {
        display: 'flex',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
      },
    },
      React.createElement('button', { onClick: () => setRightPanelTab('changes'), style: tabStyle('changes') }, 'Changes'),
      React.createElement('button', { onClick: () => setRightPanelTab('files'), style: tabStyle('files') }, 'Files'),
      React.createElement('button', { onClick: () => setRightPanelTab('info'), style: tabStyle('info') }, 'Info'),
    ),

    // Tab content
    React.createElement('div', { style: { flex: 1, overflow: 'auto', padding: '8px' } },
      activeTab === 'changes' ? renderChangesTab() : null,
      activeTab === 'files' ? renderFilesTab() : null,
      activeTab === 'info' ? renderInfoTab() : null,
    ),
  )

  function renderChangesTab() {
    return React.createElement('div', null,
      // Stage All button
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
      },
        React.createElement('span', {
          style: { fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 },
        }, 'Changes'),
        React.createElement('button', {
          onClick: handleStageAll,
          disabled: loading || changedFiles.length === 0,
          style: {
            background: 'none', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', padding: '2px 8px', cursor: 'pointer', fontSize: 'var(--text-xs)',
            opacity: loading || changedFiles.length === 0 ? 0.5 : 1,
          },
        }, loading ? 'Staging...' : 'Stage All'),
      ),

      // File groups
      ...Object.entries(grouped).map(([group, files]) =>
        React.createElement('div', { key: group, style: { marginBottom: '8px' } },
          React.createElement('div', {
            style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' },
          }, `${group} (${files.length})`),
          ...files.map(f =>
            React.createElement('div', {
              key: f.path,
              onClick: () => handleFileClick(f.path),
              style: {
                padding: '2px 4px', cursor: 'pointer', fontSize: 'var(--text-sm)',
                display: 'flex', alignItems: 'center', gap: '6px',
                borderRadius: 'var(--radius-sm)',
              },
              onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)' },
              onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.backgroundColor = 'transparent' },
            },
              React.createElement('span', {
                style: { color: statusColor(f.status), fontFamily: 'Consolas, monospace', fontSize: 'var(--text-xs)', width: '14px' },
              }, f.status),
              React.createElement('span', {
                style: { color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
              }, f.path),
            )
          ),
        )
      ),

      // Empty state
      changedFiles.length === 0 ? React.createElement('div', {
        style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center' as const, padding: '24px 0' },
      }, 'No changes detected') : null,

      // Create PR button
      changedFiles.length > 0 ? React.createElement('div', {
        style: { borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '8px' },
      },
        React.createElement('button', {
          onClick: handleCreatePR,
          style: {
            width: '100%', padding: '6px', background: 'var(--accent)', border: 'none',
            borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', fontSize: 'var(--text-sm)',
          },
        }, 'Create PR'),
      ) : null,
    )
  }

  function renderFilesTab() {
    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column' as const, height: '100%' } },
      // File tree
      React.createElement('div', { style: { flex: 1, overflow: 'auto' } },
        fileTree.length === 0
          ? React.createElement('div', {
              style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center' as const, padding: '24px 0' },
            }, 'Loading...')
          : renderFileTree(fileTree),
      ),
      // Selected file info
      selectedFile ? React.createElement('div', {
        style: {
          borderTop: '1px solid var(--border-subtle)', padding: '4px 8px',
          fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
          display: 'flex', justifyContent: 'space-between',
        },
      },
        React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const } }, selectedFile),
        savedIndicator ? React.createElement('span', { style: { color: 'var(--working)' } }, 'Saved') : null,
      ) : null,
    )
  }

  function renderInfoTab() {
    return React.createElement('div', null,
      // Plugin info
      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' },
        },
          React.createElement('span', { style: { fontSize: 'var(--text-base)' } }, '\u25C6'),
          React.createElement('span', {
            style: { fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500 },
          }, `${pluginName ?? 'raw'} detected`),
        ),
      ),

      // Separator
      React.createElement('div', { style: { borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' } }),

      // Agent summary
      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('div', {
          style: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' },
        }, `Active agents: ${agents.length}`),
        React.createElement('div', {
          style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' },
        }, `Working: ${workingCount} \u00B7 Waiting: ${waitingCount} \u00B7 Idle: ${idleCount}`),
      ),

      // Separator
      React.createElement('div', { style: { borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' } }),

      // Session cost placeholder
      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('div', {
          style: { fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '4px' },
        }, 'Session cost'),
        React.createElement('div', { style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' } }, 'Input:   — tokens'),
        React.createElement('div', { style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' } }, 'Output:  — tokens'),
        React.createElement('div', { style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' } }, 'Cost:    — est.'),
      ),

      // Separator
      React.createElement('div', { style: { borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' } }),

      // MCP Servers placeholder
      React.createElement('div', null,
        React.createElement('div', {
          style: { fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '4px' },
        }, 'MCP Servers'),
        React.createElement('div', {
          style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' },
        }, 'Configure in Settings'),
      ),
    )
  }
}

export default RightPanel
