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

  useEffect(() => {
    if (!containerRef.current || !window.agentflow?.terminal) return

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

      // Create or reconnect to existing terminal
      const result = await window.agentflow.terminal.create(id, worktreePath, openCommand)

      // Replay buffer if terminal already existed (persistent session)
      if (result.existed) {
        const buffer = await window.agentflow.terminal.getBuffer(id)
        buffer.forEach((chunk: string) => xterm.write(chunk))
        xterm.write('\r\n\x1b[33m[agentflow] session reconnected\x1b[0m\r\n')
      }

      // Inject initial prompt only on new terminals
      if (!result.existed && initialPrompt) {
        let promptInjected = false

        const checkInterval = setInterval(() => {
          if (promptInjected || !isMounted) { clearInterval(checkInterval); return }
        }, 500)

        // Fallback: inject after 3s
        setTimeout(() => {
          if (!promptInjected && isMounted) {
            promptInjected = true
            clearInterval(checkInterval)
            window.agentflow.terminal.input(id, initialPrompt + '\n')
          }
        }, 3000)
      }

      // Receive output from main process
      const removeOutput = window.agentflow.terminal.onOutput((termId: string, data: string) => {
        if (termId === id && isMounted && xtermRef.current) {
          xtermRef.current.write(data)
        }
      })

      // Send input to main process
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
        // Do NOT close the pty on unmount — only disconnect the xterm renderer
      }
    }

    init()

    return () => {
      isMounted = false
      cleanupRef.current?.()
      xtermRef.current?.dispose()
    }
  }, [id]) // id is stable — effect runs once per terminal

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%', height: '100%', minHeight: '200px',
      backgroundColor: '#0a0a0a', padding: '4px',
    },
  })
}

export default Terminal
