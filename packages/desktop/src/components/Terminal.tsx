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
    xterm.open(containerRef.current)
    setTimeout(() => fitAddon.fit(), 50)

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Create process in main
    window.agentflow.terminal.create(id, worktreePath, openCommand)

    // Track if initial prompt has been injected
    let promptInjected = !initialPrompt

    // Receive output from process
    const removeOutput = window.agentflow.terminal.onOutput((termId: string, data: string) => {
      if (termId !== id || !xtermRef.current) return
      xtermRef.current.write(data)

      // Inject initial prompt when terminal is ready (prompt char detected)
      if (!promptInjected && initialPrompt) {
        if (data.includes('>') || data.includes('$') || data.includes('\u276F')) {
          promptInjected = true
          setTimeout(() => {
            window.agentflow.terminal.input(id, initialPrompt + '\n')
          }, 800)
        }
      }
    })

    // Send input to process
    xterm.onData((data: string) => {
      window.agentflow.terminal.input(id, data)
    })

    // Auto-resize
    const resizeObserver = new ResizeObserver(() => {
      if (!fitAddonRef.current || !xtermRef.current) return
      try {
        fitAddonRef.current.fit()
        window.agentflow.terminal.resize(id, xtermRef.current.cols, xtermRef.current.rows)
      } catch {}
    })
    resizeObserver.observe(containerRef.current)

    cleanupRef.current = () => {
      removeOutput?.()
      resizeObserver.disconnect()
      window.agentflow.terminal.close(id)
      xterm.dispose()
    }

    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [id, worktreePath, openCommand, initialPrompt])

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%', height: '100%', minHeight: '200px',
      backgroundColor: '#0a0a0a', padding: '4px',
    },
  })
}

export default Terminal
