import * as React from 'react'
import { useEffect, useRef } from 'react'

interface Props {
  id: string
  worktreePath: string
  openCommand?: string
}

const Terminal: React.FC<Props> = ({ id, worktreePath, openCommand = 'claude' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<string>('')
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (!window.agentflow?.terminal) return

    // Create terminal in main process
    window.agentflow.terminal.create(id, worktreePath, openCommand)

    // Listen for output
    const cleanup = window.agentflow.terminal.onOutput((termId: string, data: string) => {
      if (termId === id && preRef.current) {
        contentRef.current += data
        preRef.current.textContent = contentRef.current
        preRef.current.scrollTop = preRef.current.scrollHeight
      }
    })

    return () => {
      cleanup()
      window.agentflow.terminal.close(id)
    }
  }, [id, worktreePath, openCommand])

  // Simple input handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!window.agentflow?.terminal) return
    if (e.key === 'Enter') {
      window.agentflow.terminal.input(id, '\r')
    } else if (e.key === 'Backspace') {
      window.agentflow.terminal.input(id, '\x7f')
    } else if (e.key.length === 1) {
      window.agentflow.terminal.input(id, e.key)
    }
  }

  return React.createElement('div', {
    ref: containerRef,
    tabIndex: 0,
    onKeyDown: handleKeyDown,
    style: {
      width: '100%',
      height: '100%',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column' as const,
      outline: 'none',
    },
  },
    React.createElement('pre', {
      ref: preRef,
      style: {
        flex: 1,
        margin: 0,
        padding: '8px 12px',
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        lineHeight: '1.4',
        color: '#ededed',
        overflow: 'auto',
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-all' as const,
      },
    }),
    React.createElement('div', {
      style: { padding: '4px 12px', borderTop: '1px solid #1f1f1f', color: '#555', fontSize: '11px' },
    }, 'Clique para focar \u2022 Terminal b\u00E1sico (xterm.js dispon\u00EDvel via node-pty)')
  )
}

export default Terminal
