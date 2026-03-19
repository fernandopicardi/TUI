import * as React from 'react'
import { useState, useEffect, useRef } from 'react'

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
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '13px' },
    }, 'Carregando diff...')
  }

  if (data.files.length === 0) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '8px' },
    },
      React.createElement('span', { style: { fontSize: '24px' } }, '\u2713'),
      React.createElement('span', { style: { color: '#888', fontSize: '13px' } }, 'Nenhuma altera\u00E7\u00E3o neste workspace')
    )
  }

  return React.createElement('div', {
    style: { height: '100%', display: 'flex', flexDirection: 'column' as const },
  },
    // File tabs
    React.createElement('div', {
      style: {
        display: 'flex', gap: 0, padding: '0 8px',
        borderBottom: '1px solid #1f1f1f', overflowX: 'auto' as const, flexShrink: 0,
      },
    },
      ...data.files.map((f) =>
        React.createElement('button', {
          key: f,
          onClick: () => setSelectedFile(f),
          style: {
            background: 'transparent', border: 'none',
            borderBottom: selectedFile === f ? '2px solid #5b6af0' : '2px solid transparent',
            padding: '8px 14px', color: selectedFile === f ? '#ededed' : '#666',
            fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' as const,
            fontFamily: 'Consolas, monospace',
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
            style: { flex: 1, overflow: 'auto', borderRight: '1px solid #1f1f1f' },
          },
            React.createElement('div', {
              style: { padding: '4px 8px', borderBottom: '1px solid #1f1f1f', fontSize: '11px', color: '#ef4444', position: 'sticky' as const, top: 0, backgroundColor: '#0a0a0a' },
            }, '\u2212 Original (HEAD)'),
            React.createElement('pre', {
              style: { margin: 0, padding: '8px', fontSize: '12px', fontFamily: 'Consolas, monospace', color: '#ccc', whiteSpace: 'pre-wrap' as const, lineHeight: '1.5' },
            }, diff.original || '(vazio)')
          ),
          // Modified
          React.createElement('div', {
            style: { flex: 1, overflow: 'auto' },
          },
            React.createElement('div', {
              style: { padding: '4px 8px', borderBottom: '1px solid #1f1f1f', fontSize: '11px', color: '#22c55e', position: 'sticky' as const, top: 0, backgroundColor: '#0a0a0a' },
            }, '+ Modificado'),
            React.createElement('pre', {
              style: { margin: 0, padding: '8px', fontSize: '12px', fontFamily: 'Consolas, monospace', color: '#ccc', whiteSpace: 'pre-wrap' as const, lineHeight: '1.5' },
            }, diff.modified || '(vazio)')
          )
        )
      : null
  )
}

export default DiffViewer
