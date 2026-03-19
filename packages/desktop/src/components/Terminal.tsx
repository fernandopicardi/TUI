import * as React from 'react'
import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'

interface Props {
  id: string
  worktreePath: string
  openCommand?: string
  initialPrompt?: string
}

const Terminal: React.FC<Props> = ({ id, worktreePath, openCommand = 'claude', initialPrompt }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || !window.agentflow?.terminal || !id) return
    // Prevent double-init (React StrictMode, etc)
    if (initializedRef.current) return
    initializedRef.current = true

    let isMounted = true

    const init = async () => {
      const xterm = new XTerm({
        theme: {
          background: '#0a0a0a',
          foreground: '#ededed',
          cursor: '#5b6af0',
          selectionBackground: '#5b6af033',
          black: '#1a1a1a',
          brightBlack: '#444444',
        },
        fontFamily: 'Consolas, "Cascadia Code", "Courier New", monospace',
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        scrollback: 5000,
      })

      const fitAddon = new FitAddon()
      xterm.loadAddon(fitAddon)
      xterm.open(containerRef.current!)

      await new Promise(r => setTimeout(r, 50))
      fitAddon.fit()

      if (!isMounted) { xterm.dispose(); return }

      xtermRef.current = xterm
      fitAddonRef.current = fitAddon

      // Register output listener FIRST to avoid losing data during reconnect
      const removeOutput = window.agentflow.terminal.onOutput((termId: string, data: string) => {
        if (termId === id && isMounted && xtermRef.current) {
          xtermRef.current.write(data)
        }
      })

      // Create or reconnect to existing terminal in main process
      const result = await window.agentflow.terminal.create(id, worktreePath, openCommand)

      if (!isMounted) { removeOutput?.(); return }

      // Replay buffer if terminal already existed (persistent session)
      if (result.existed && result.buffer) {
        result.buffer.forEach((chunk: string) => xterm.write(chunk))
        xterm.write('\r\n\x1b[33m[agentflow] session reconnected\x1b[0m\r\n')
      }

      // Inject initial prompt only on NEW terminals
      if (!result.existed && initialPrompt) {
        let promptInjected = false
        // Fallback: inject after 3s regardless
        setTimeout(() => {
          if (!promptInjected && isMounted) {
            promptInjected = true
            window.agentflow.terminal.input(id, initialPrompt + '\n')
          }
        }, 3000)
      }

      // Send input from xterm to main process
      xterm.onData((data: string) => {
        window.agentflow.terminal.input(id, data)
      })

      // Auto-resize
      const resizeObserver = new ResizeObserver(() => {
        if (!isMounted || !fitAddonRef.current || !xtermRef.current) return
        try {
          fitAddonRef.current.fit()
          window.agentflow.terminal.resize(id, xtermRef.current.cols, xtermRef.current.rows)
        } catch {}
      })
      resizeObserver.observe(containerRef.current!)

      cleanupRef.current = () => {
        removeOutput?.()
        resizeObserver.disconnect()
        // Do NOT close the pty — it persists in main process across navigation
      }
    }

    init()

    return () => {
      isMounted = false
      initializedRef.current = false
      cleanupRef.current?.()
      xtermRef.current?.dispose()
      xtermRef.current = null
    }
  }, [id]) // id is stable per agent — effect runs once

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%', height: '100%', minHeight: '200px',
      backgroundColor: '#0a0a0a', padding: '4px',
    },
  })
}

export default Terminal
