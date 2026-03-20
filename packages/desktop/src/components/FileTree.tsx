import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { FileEntry } from '../types'

interface Props {
  worktreePath: string
}

const GIT_STATUS_COLORS: Record<string, string> = {
  M: 'var(--waiting)',
  A: 'var(--working)',
  D: 'var(--error)',
  '?': 'var(--text-tertiary)',
}

const FILE_ICONS: Record<string, string> = {
  ts: '\u25A0', tsx: '\u25A0', js: '\u25A0', jsx: '\u25A0',
  json: '\u25C7', md: '\u25CB', yml: '\u25CB', yaml: '\u25CB',
  css: '\u25C6', html: '\u25C6', svg: '\u25C6',
  default: '\u25AB',
}

const FileTree: React.FC<Props> = ({ worktreePath }) => {
  const [tree, setTree] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'changed'>('all')

  const loadTree = useCallback(() => {
    if (!window.runnio?.files) return
    setLoading(true)
    window.runnio.files.list(worktreePath)
      .then(setTree)
      .catch(() => setTree([]))
      .finally(() => setLoading(false))
  }, [worktreePath])

  useEffect(() => { loadTree() }, [loadTree])

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const openFile = async (entry: FileEntry) => {
    setSelectedFile(entry.path)
    setFileLoading(true)
    setFileContent(null)
    try {
      const fullPath = worktreePath.replace(/\\/g, '/') + '/' + entry.path
      const result = await window.runnio.files.read(fullPath)
      if (result.success) {
        setFileContent(result.content || '')
      } else {
        setFileContent(`Error: ${result.error}`)
      }
    } catch (err: any) {
      setFileContent(`Error: ${err.message}`)
    }
    setFileLoading(false)
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    return FILE_ICONS[ext] || FILE_ICONS.default
  }

  // Collect changed files recursively
  const hasChanges = (entries: FileEntry[]): boolean => {
    return entries.some(e =>
      e.type === 'file' ? !!e.gitStatus : (e.children ? hasChanges(e.children) : false)
    )
  }

  const filterTree = (entries: FileEntry[]): FileEntry[] => {
    if (filter === 'all') return entries
    return entries.reduce<FileEntry[]>((acc, e) => {
      if (e.type === 'file') {
        if (e.gitStatus) acc.push(e)
      } else if (e.children) {
        const filtered = filterTree(e.children)
        if (filtered.length > 0) {
          acc.push({ ...e, children: filtered })
        }
      }
      return acc
    }, [])
  }

  const countChanged = (entries: FileEntry[]): number => {
    return entries.reduce((c, e) =>
      e.type === 'file' ? c + (e.gitStatus ? 1 : 0) : c + (e.children ? countChanged(e.children) : 0),
    0)
  }

  const renderEntry = (entry: FileEntry, depth: number): React.ReactElement => {
    const indent = depth * 16
    const isDir = entry.type === 'directory'
    const isExpanded = expandedDirs.has(entry.path)
    const isSelected = selectedFile === entry.path

    if (isDir) {
      return React.createElement(React.Fragment, { key: entry.path },
        React.createElement('button', {
          onClick: () => toggleDir(entry.path),
          style: {
            width: '100%', display: 'flex', alignItems: 'center', gap: '4px',
            paddingLeft: `${8 + indent}px`, paddingRight: '8px', paddingTop: '3px', paddingBottom: '3px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
            textAlign: 'left' as const, transition: 'background 100ms',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' },
        },
          React.createElement('span', {
            style: { fontSize: '9px', width: '10px', color: 'var(--text-disabled)', transition: 'transform 100ms', transform: isExpanded ? 'rotate(90deg)' : 'none' },
          }, '\u25B6'),
          React.createElement('span', { style: { color: 'var(--accent)', fontSize: '10px' } }, '\u25A0'),
          React.createElement('span', {
            style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
          }, entry.name),
        ),
        isExpanded && entry.children
          ? entry.children.map(child => renderEntry(child, depth + 1))
          : null,
      )
    }

    // File
    const statusColor = entry.gitStatus ? GIT_STATUS_COLORS[entry.gitStatus] || '' : ''

    return React.createElement('button', {
      key: entry.path,
      onClick: () => openFile(entry),
      style: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '4px',
        paddingLeft: `${8 + indent}px`, paddingRight: '8px', paddingTop: '3px', paddingBottom: '3px',
        background: isSelected ? 'var(--bg-selected)' : 'transparent',
        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
        border: 'none', cursor: 'pointer',
        color: entry.gitStatus ? statusColor : 'var(--text-primary)',
        fontSize: 'var(--text-sm)', fontFamily: 'Consolas, monospace',
        textAlign: 'left' as const, transition: 'background 100ms',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { if (!isSelected) e.currentTarget.style.background = 'transparent' },
    },
      React.createElement('span', { style: { fontSize: '9px', color: 'var(--text-disabled)', width: '10px' } }, getFileIcon(entry.name)),
      React.createElement('span', {
        style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
      }, entry.name),
      entry.gitStatus
        ? React.createElement('span', {
            style: { fontSize: '10px', fontWeight: 600, color: statusColor, minWidth: '12px', textAlign: 'right' as const },
          }, entry.gitStatus)
        : null,
    )
  }

  const changedCount = countChanged(tree)
  const displayTree = filterTree(tree)

  if (loading) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-base)' },
    }, 'Loading files...')
  }

  return React.createElement('div', {
    style: { height: '100%', display: 'flex', overflow: 'hidden' },
  },
    // Left: tree panel
    React.createElement('div', {
      style: {
        width: selectedFile ? '240px' : '100%', minWidth: '200px',
        display: 'flex', flexDirection: 'column' as const,
        borderRight: selectedFile ? '1px solid var(--border-default)' : 'none',
        overflow: 'hidden',
      },
    },
      // Toolbar
      React.createElement('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderBottom: '1px solid var(--border-default)',
          flexShrink: 0,
        },
      },
        React.createElement('button', {
          onClick: () => setFilter('all'),
          style: {
            padding: '2px 8px', fontSize: 'var(--text-xs)', cursor: 'pointer',
            background: filter === 'all' ? 'var(--bg-selected)' : 'transparent',
            border: filter === 'all' ? '1px solid var(--accent)' : '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)', color: filter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
            transition: 'all 100ms',
          },
        }, 'All files'),
        React.createElement('button', {
          onClick: () => setFilter('changed'),
          style: {
            padding: '2px 8px', fontSize: 'var(--text-xs)', cursor: 'pointer',
            background: filter === 'changed' ? 'var(--bg-selected)' : 'transparent',
            border: filter === 'changed' ? '1px solid var(--accent)' : '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)', color: filter === 'changed' ? 'var(--text-primary)' : 'var(--text-secondary)',
            transition: 'all 100ms',
          },
        }, `Changed (${changedCount})`),
        React.createElement('div', { style: { flex: 1 } }),
        React.createElement('button', {
          onClick: loadTree,
          title: 'Refresh',
          style: {
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-disabled)', fontSize: 'var(--text-sm)', padding: '2px',
            transition: 'color 100ms',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-secondary)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
        }, '\u21BB'),
      ),
      // Tree
      React.createElement('div', {
        style: { flex: 1, overflowY: 'auto' as const, padding: '4px 0' },
      },
        displayTree.length === 0
          ? React.createElement('div', {
              style: { padding: '16px', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center' as const },
            }, filter === 'changed' ? 'No changed files' : 'No files found')
          : displayTree.map(e => renderEntry(e, 0)),
      ),
    ),

    // Right: file viewer
    selectedFile
      ? React.createElement('div', {
          style: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
        },
          // File header
          React.createElement('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderBottom: '1px solid var(--border-default)',
              flexShrink: 0,
            },
          },
            React.createElement('span', {
              style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'Consolas, monospace', flex: 1 },
            }, selectedFile),
            React.createElement('button', {
              onClick: () => { setSelectedFile(null); setFileContent(null) },
              style: {
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-disabled)', fontSize: 'var(--text-sm)',
                transition: 'color 100ms',
              },
              onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-secondary)' },
              onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
            }, '\u00D7'),
          ),
          // File content
          React.createElement('div', {
            style: { flex: 1, overflow: 'auto', padding: 0 },
          },
            fileLoading
              ? React.createElement('div', {
                  style: { padding: '16px', color: 'var(--text-secondary)', fontSize: 'var(--text-base)' },
                }, 'Loading...')
              : React.createElement('pre', {
                  style: {
                    margin: 0, padding: '12px', fontSize: 'var(--text-sm)',
                    fontFamily: 'Consolas, "Cascadia Code", monospace',
                    color: 'var(--text-primary)', whiteSpace: 'pre-wrap' as const,
                    lineHeight: '1.5', background: '#0a0a0a',
                    minHeight: '100%',
                  },
                }, fileContent || ''),
          ),
        )
      : null,
  )
}

export default FileTree
