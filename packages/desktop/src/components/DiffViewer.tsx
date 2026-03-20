import * as React from 'react'
import { useState, useEffect } from 'react'

interface Props {
  worktreePath: string
}

interface DiffData {
  files: string[]
  diffs: Record<string, { original: string; modified: string }>
}

const DiffViewer: React.FC<Props> = ({ worktreePath }) => {
  const [data, setData] = useState<DiffData>({ files: [], diffs: {} })
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!window.agentflow?.github) return
    setLoading(true)
    window.agentflow.github.getDiff(worktreePath)
      .then((result) => {
        setData(result || { files: [], diffs: {} })
        if (result.files?.length > 0) setSelectedFile(result.files[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [worktreePath])

  const diff = selectedFile ? (data.diffs[selectedFile] || { original: '', modified: '' }) : null

  if (loading) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-base)' },
    }, 'Loading diff...')
  }

  if (data.files.length === 0) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '8px' },
    },
      React.createElement('span', { style: { fontSize: '24px', color: 'var(--working)' } }, '\u2713'),
      React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-base)' } }, 'No changes in this workspace'),
      React.createElement('span', { style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' } }, 'All files are up to date'),
    )
  }

  return React.createElement('div', {
    style: { height: '100%', display: 'flex', flexDirection: 'column' as const },
  },
    // File tabs
    React.createElement('div', {
      style: {
        display: 'flex', gap: 0, padding: '0 8px',
        borderBottom: '1px solid var(--border-default)', overflowX: 'auto' as const, flexShrink: 0,
      },
    },
      ...data.files.map((f) =>
        React.createElement('button', {
          key: f,
          onClick: () => setSelectedFile(f),
          style: {
            background: 'transparent', border: 'none',
            borderBottom: selectedFile === f ? '2px solid var(--accent)' : '2px solid transparent',
            padding: '8px 14px', color: selectedFile === f ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 'var(--text-sm)', cursor: 'pointer', whiteSpace: 'nowrap' as const,
            fontFamily: 'Consolas, monospace', transition: 'all 150ms',
          },
        }, f.split(/[\\/]/).pop())
      )
    ),
    // Diff content
    diff
      ? React.createElement('div', {
          style: { display: 'flex', flex: 1, overflow: 'hidden' },
        },
          // Original
          React.createElement('div', {
            style: { flex: 1, overflow: 'auto', borderRight: '1px solid var(--border-default)' },
          },
            React.createElement('div', {
              style: { padding: '4px 8px', borderBottom: '1px solid var(--border-default)', fontSize: 'var(--text-xs)', color: 'var(--error)', position: 'sticky' as const, top: 0, backgroundColor: '#0a0a0a' },
            }, '\u2212 Original (HEAD)'),
            React.createElement('pre', {
              style: { margin: 0, padding: '8px', fontSize: 'var(--text-sm)', fontFamily: 'Consolas, monospace', color: '#ccc', whiteSpace: 'pre-wrap' as const, lineHeight: '1.5' },
            }, diff.original || '(empty)')
          ),
          // Modified
          React.createElement('div', {
            style: { flex: 1, overflow: 'auto' },
          },
            React.createElement('div', {
              style: { padding: '4px 8px', borderBottom: '1px solid var(--border-default)', fontSize: 'var(--text-xs)', color: 'var(--working)', position: 'sticky' as const, top: 0, backgroundColor: '#0a0a0a' },
            }, '+ Modified'),
            React.createElement('pre', {
              style: { margin: 0, padding: '8px', fontSize: 'var(--text-sm)', fontFamily: 'Consolas, monospace', color: '#ccc', whiteSpace: 'pre-wrap' as const, lineHeight: '1.5' },
            }, diff.modified || '(empty)')
          )
        )
      : null
  )
}

export default DiffViewer
