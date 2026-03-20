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
  const terminalReadyRef = useRef(false)
  const pendingPromptRef = useRef<string | null>(null)

  // Main effect: create xterm + connect to pty (runs once per id)
  useEffect(() => {
    if (!containerRef.current || !window.agentflow?.terminal || !id) return
    if (initializedRef.current) return
    initializedRef.current = true
    terminalReadyRef.current = false

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

      // Paste dedup flag — Ctrl+V handler sets this so the browser paste event won't fire twice
      let pasteHandled = false

      // Handle Ctrl+V paste
      xterm.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if (e.type === 'keydown' && e.ctrlKey && e.key === 'v') {
          pasteHandled = true
          navigator.clipboard.readText().then(text => {
            if (text) window.agentflow.terminal.input(id, text)
          }).catch(() => {})
          setTimeout(() => { pasteHandled = false }, 100)
          return false
        }
        return true
      })

      // Register output listener FIRST to avoid losing data
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

      terminalReadyRef.current = true

      // Inject initial prompt on NEW terminals using readiness detection
      if (!result.existed && initialPrompt) {
        pendingPromptRef.current = null
        window.agentflow.terminal.injectWhenReady(id, initialPrompt)
      }

      // Check if there's a pending prompt from InitBanner
      if (pendingPromptRef.current) {
        const prompt = pendingPromptRef.current
        pendingPromptRef.current = null
        window.agentflow.terminal.injectWhenReady(id, prompt)
      }

      // Send input from xterm to main process
      xterm.onData((data: string) => {
        window.agentflow.terminal.input(id, data)
      })

      // Handle right-click / context-menu paste (skip if Ctrl+V already handled it)
      containerRef.current!.addEventListener('paste', (e: ClipboardEvent) => {
        e.preventDefault()
        if (pasteHandled) return
        const text = e.clipboardData?.getData('text')
        if (text) window.agentflow.terminal.input(id, text)
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
      }
    }

    init()

    return () => {
      isMounted = false
      initializedRef.current = false
      terminalReadyRef.current = false
      cleanupRef.current?.()
      xtermRef.current?.dispose()
      xtermRef.current = null
    }
  }, [id])

  // Separate effect: inject prompt into EXISTING terminal when initialPrompt changes
  useEffect(() => {
    if (!initialPrompt || !id) return

    const prompt = initialPrompt

    if (terminalReadyRef.current) {
      // Terminal is running — use readiness-based injection
      window.agentflow.terminal.injectWhenReady(id, prompt)
    } else {
      // Terminal not ready yet — store for later injection
      pendingPromptRef.current = prompt
    }
  }, [initialPrompt, id])

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%', height: '100%', minHeight: '200px',
      backgroundColor: '#0a0a0a', padding: '4px',
    },
  })
}

export default Terminal
