import * as React from 'react'
import { useState, useEffect } from 'react'

interface Props {
  worktreePath: string
}

const DiffViewer: React.FC<Props> = ({ worktreePath }) => {
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [diff, setDiff] = useState<{ original: string; modified: string }>({ original: '', modified: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!window.agentflow?.github) return
    setLoading(true)
    window.agentflow.github.getDiff(worktreePath).then((result) => {
      setFiles(result.files || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [worktreePath])

  useEffect(() => {
    if (!selectedFile || !window.agentflow?.github) return
    window.agentflow.github.getDiff(worktreePath).then((result) => {
      const fileDiff = result.diffs?.[selectedFile]
      if (fileDiff) setDiff(fileDiff)
    })
  }, [selectedFile, worktreePath])

  return React.createElement('div', {
    style: { height: '100%', display: 'flex', flexDirection: 'column' as const },
  },
    // File tabs
    React.createElement('div', {
      style: {
        display: 'flex', gap: '4px', padding: '8px 12px',
        borderBottom: '1px solid #1f1f1f', overflowX: 'auto' as const,
        flexShrink: 0,
      },
    },
      loading
        ? React.createElement('span', { style: { color: '#888', fontSize: '12px' } }, 'Carregando...')
        : files.length === 0
          ? React.createElement('span', { style: { color: '#888', fontSize: '12px' } }, 'Nenhuma altera\u00E7\u00E3o detectada')
          : files.map((f) =>
              React.createElement('button', {
                key: f,
                onClick: () => setSelectedFile(f),
                style: {
                  background: selectedFile === f ? '#1f1f1f' : 'transparent',
                  border: '1px solid #1f1f1f', borderRadius: '4px',
                  padding: '4px 10px', color: selectedFile === f ? '#ededed' : '#888',
                  fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' as const,
                },
              }, f.split(/[\\/]/).pop())
            )
    ),
    // Diff content
    React.createElement('div', {
      style: { flex: 1, overflow: 'hidden', display: 'flex' },
    },
      selectedFile
        ? React.createElement('div', {
            style: { display: 'flex', flex: 1, overflow: 'hidden' },
          },
            // Original
            React.createElement('div', {
              style: { flex: 1, overflow: 'auto', borderRight: '1px solid #1f1f1f' },
            },
              React.createElement('div', {
                style: { padding: '4px 8px', borderBottom: '1px solid #1f1f1f', fontSize: '11px', color: '#888', position: 'sticky' as const, top: 0, backgroundColor: '#0a0a0a' },
              }, 'Original (HEAD)'),
              React.createElement('pre', {
                style: { margin: 0, padding: '8px', fontSize: '12px', fontFamily: 'Consolas, monospace', color: '#ccc', whiteSpace: 'pre-wrap' as const },
              }, diff.original || '(vazio)')
            ),
            // Modified
            React.createElement('div', {
              style: { flex: 1, overflow: 'auto' },
            },
              React.createElement('div', {
                style: { padding: '4px 8px', borderBottom: '1px solid #1f1f1f', fontSize: '11px', color: '#888', position: 'sticky' as const, top: 0, backgroundColor: '#0a0a0a' },
              }, 'Modificado'),
              React.createElement('pre', {
                style: { margin: 0, padding: '8px', fontSize: '12px', fontFamily: 'Consolas, monospace', color: '#ccc', whiteSpace: 'pre-wrap' as const },
              }, diff.modified || '(vazio)')
            )
          )
        : React.createElement('div', {
            style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '13px' },
          }, 'Selecione um arquivo para ver o diff')
    )
  )
}

export default DiffViewer
