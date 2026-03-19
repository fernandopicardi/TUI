import * as React from 'react'
import { useState, useEffect } from 'react'

interface Props {
  worktreePath: string
  branch: string
}

const PRPanel: React.FC<Props> = ({ worktreePath, branch }) => {
  const [files, setFiles] = useState<string[]>([])

  useEffect(() => {
    if (!window.agentflow?.github) return
    window.agentflow.github.getDiff(worktreePath)
      .then((result) => setFiles(result?.files || []))
      .catch(() => {})
  }, [worktreePath])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: '#111', border: '1px solid #1f1f1f',
    borderRadius: '6px', color: '#ededed', fontSize: '13px',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  return React.createElement('div', {
    style: { padding: '24px', maxWidth: '560px' },
  },
    React.createElement('div', {
      style: { marginBottom: '20px' },
    },
      React.createElement('h3', {
        style: { margin: 0, color: '#ededed', fontSize: '16px', fontWeight: 600, marginBottom: '8px' },
      }, 'Pull Request'),
      React.createElement('p', {
        style: { color: '#888', fontSize: '13px', margin: 0, lineHeight: '1.5' },
      }, 'Configure seu GitHub Token para criar PRs diretamente.')
    ),

    // Files changed
    files.length > 0
      ? React.createElement('div', { style: { marginBottom: '20px' } },
          React.createElement('p', {
            style: { color: '#888', fontSize: '12px', marginBottom: '8px' },
          }, `${files.length} arquivo(s) alterado(s):`),
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' as const, gap: '4px', maxHeight: '120px', overflow: 'auto' },
          },
            ...files.map((f) =>
              React.createElement('div', {
                key: f,
                style: {
                  padding: '6px 10px', background: '#111', borderRadius: '4px',
                  fontSize: '12px', color: '#ededed', fontFamily: 'Consolas, monospace',
                  border: '1px solid #1f1f1f',
                },
              }, f)
            )
          )
        )
      : React.createElement('p', {
          style: { color: '#555', fontSize: '13px', marginBottom: '20px' },
        }, 'Nenhuma altera\u00E7\u00E3o detectada neste workspace.'),

    // Config instruction
    React.createElement('div', {
      style: {
        padding: '16px', background: '#111', border: '1px solid #1f1f1f',
        borderRadius: '8px',
      },
    },
      React.createElement('p', {
        style: { color: '#888', fontSize: '12px', margin: '0 0 8px' },
      }, 'Adicione ao agentflow.config.json:'),
      React.createElement('pre', {
        style: {
          background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '6px',
          padding: '12px', fontSize: '12px', color: '#5b6af0', margin: 0, overflow: 'auto',
        },
      }, '{\n  "githubToken": "ghp_seu_token_aqui"\n}')
    )
  )
}

export default PRPanel
