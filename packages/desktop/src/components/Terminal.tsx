import * as React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { useStore } from '../store/index'

interface Props {
  id: string
  worktreePath: string
  openCommand?: string
  initialPrompt?: string
  visible?: boolean
}

const XTERM_THEME = {
  background: '#0d1117',
  foreground: '#e6edf3',
  cursor: '#6366f1',
  cursorAccent: '#0d1117',
  selectionBackground: '#6366f166',
  selectionForeground: '#e6edf3',
  black: '#1a1a1a',
  brightBlack: '#484f58',
  red: '#f85149',
  brightRed: '#ff7b72',
  green: '#3fb950',
  brightGreen: '#56d364',
  yellow: '#d29922',
  brightYellow: '#e3b341',
  blue: '#58a6ff',
  brightBlue: '#79c0ff',
  magenta: '#bc8cff',
  brightMagenta: '#d2a8ff',
  cyan: '#39d2c0',
  brightCyan: '#56d4dd',
  white: '#b1bac4',
  brightWhite: '#f0f6fc',
}

const Terminal: React.FC<Props> = ({ id, worktreePath, openCommand = 'claude', initialPrompt, visible = true }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const initializedRef = useRef(false)
  const terminalReadyRef = useRef(false)
  const pendingPromptRef = useRef<string | null>(null)
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevVisibleRef = useRef(visible)

  // Stable fit function — debounced to avoid rapid-fire layout thrashing
  const debouncedFit = useCallback(() => {
    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
    resizeTimerRef.current = setTimeout(() => {
      if (!fitAddonRef.current || !xtermRef.current) return
      try {
        fitAddonRef.current.fit()
        window.runnio.terminal.resize(id, xtermRef.current.cols, xtermRef.current.rows)
      } catch {}
    }, 50)
  }, [id])

  // Visibility change: re-fit and refresh when terminal becomes visible
  useEffect(() => {
    const wasHidden = !prevVisibleRef.current
    prevVisibleRef.current = visible

    if (visible && wasHidden && xtermRef.current && fitAddonRef.current) {
      // Use rAF to ensure the DOM has flushed the display change before measuring
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!fitAddonRef.current || !xtermRef.current) return
          try {
            fitAddonRef.current.fit()
            xtermRef.current.refresh(0, xtermRef.current.rows - 1)
            window.runnio.terminal.resize(id, xtermRef.current.cols, xtermRef.current.rows)
            xtermRef.current.focus()
          } catch {}
        })
      })
    }
  }, [visible, id])

  // React to font/size changes from Settings
  const terminalFont = useStore(s => s.terminalFont)
  const terminalFontSize = useStore(s => s.terminalFontSize)
  useEffect(() => {
    const xterm = xtermRef.current
    if (!xterm) return
    xterm.options.fontFamily = `${terminalFont}, "Cascadia Code", "Courier New", monospace`
    xterm.options.fontSize = terminalFontSize
    // Re-fit after font change
    requestAnimationFrame(() => {
      try { fitAddonRef.current?.fit() } catch {}
    })
  }, [terminalFont, terminalFontSize])

  // Main effect: create xterm + connect to pty (runs once per id)
  useEffect(() => {
    if (!containerRef.current || !window.runnio?.terminal || !id) return
    if (initializedRef.current) return
    initializedRef.current = true
    terminalReadyRef.current = false

    let isMounted = true

    const init = async () => {
      // Clear any leftover DOM from a previous xterm instance
      const container = containerRef.current!
      while (container.firstChild) container.removeChild(container.firstChild)

      const storeState = useStore.getState()
      const xterm = new XTerm({
        theme: XTERM_THEME,
        fontFamily: `${storeState.terminalFont}, "Cascadia Code", "Courier New", monospace`,
        fontSize: storeState.terminalFontSize,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: 'bar',
        scrollback: 5000,
      })

      const fitAddon = new FitAddon()
      xterm.loadAddon(fitAddon)
      xterm.open(container)

      // Wait for xterm to render, then fit
      await new Promise(r => requestAnimationFrame(r))
      try { fitAddon.fit() } catch {}

      if (!isMounted) { xterm.dispose(); return }

      xtermRef.current = xterm
      fitAddonRef.current = fitAddon

      // ── Clipboard helpers ──
      const readClipboard = (): string => {
        try {
          // Use Electron's clipboard API (synchronous, always works)
          if (window.runnio.clipboard?.readText) {
            return window.runnio.clipboard.readText() || ''
          }
        } catch {}
        return ''
      }

      const pasteFromClipboard = () => {
        const text = readClipboard()
        if (text) window.runnio.terminal.input(id, text)
      }

      // ── Keyboard handler ──
      xterm.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        // Ctrl+V → paste
        if (e.type === 'keydown' && e.ctrlKey && e.key === 'v') {
          pasteFromClipboard()
          return false // prevent xterm default
        }
        // Ctrl+C → copy selection if any, otherwise pass through to terminal (SIGINT)
        if (e.type === 'keydown' && e.ctrlKey && e.key === 'c') {
          const selection = xterm.getSelection()
          if (selection) {
            navigator.clipboard.writeText(selection).catch(() => {})
            return false
          }
          // No selection — let it pass through as SIGINT
          return true
        }
        // Ctrl+A → select all in terminal
        if (e.type === 'keydown' && e.ctrlKey && e.key === 'a') {
          xterm.selectAll()
          return false
        }
        return true
      })

      // ── Right-click context menu paste ──
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        pasteFromClipboard()
      }
      container.addEventListener('contextmenu', handleContextMenu)

      // Register output listener FIRST to avoid losing data
      const removeOutput = window.runnio.terminal.onOutput((termId: string, data: string) => {
        if (termId === id && isMounted && xtermRef.current) {
          xtermRef.current.write(data)
        }
      })

      // Create or reconnect to existing terminal in main process
      const result = await window.runnio.terminal.create(id, worktreePath, openCommand)

      if (!isMounted) { removeOutput?.(); return }

      // Replay buffer if terminal already existed (persistent session)
      if (result.existed && result.buffer) {
        result.buffer.forEach((chunk: string) => xterm.write(chunk))
        xterm.write('\r\n\x1b[33m[runnio] session reconnected\x1b[0m\r\n')
      }

      terminalReadyRef.current = true

      // Inject initial prompt on NEW terminals using readiness detection
      if (!result.existed && initialPrompt) {
        pendingPromptRef.current = null
        window.runnio.terminal.injectWhenReady(id, initialPrompt)
      }

      // Check if there's a pending prompt from InitBanner
      if (pendingPromptRef.current) {
        const prompt = pendingPromptRef.current
        pendingPromptRef.current = null
        window.runnio.terminal.injectWhenReady(id, prompt)
      }

      // Send input from xterm to main process
      xterm.onData((data: string) => {
        window.runnio.terminal.input(id, data)
      })

      // ── Auto-resize with debounce ──
      const resizeObserver = new ResizeObserver(() => {
        if (!isMounted) return
        debouncedFit()
      })
      resizeObserver.observe(container)

      // Fit once more after a short delay (catches layout shifts from parent flex)
      setTimeout(() => {
        if (isMounted && fitAddonRef.current && xtermRef.current) {
          try {
            fitAddonRef.current.fit()
            window.runnio.terminal.resize(id, xtermRef.current.cols, xtermRef.current.rows)
          } catch {}
        }
      }, 200)

      // Auto-focus when first created
      if (visible) xterm.focus()

      cleanupRef.current = () => {
        removeOutput?.()
        resizeObserver.disconnect()
        container.removeEventListener('contextmenu', handleContextMenu)
        if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
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
      fitAddonRef.current = null
    }
  }, [id])

  // Separate effect: inject prompt into EXISTING terminal when initialPrompt changes
  useEffect(() => {
    if (!initialPrompt || !id) return

    const prompt = initialPrompt

    if (terminalReadyRef.current) {
      // Terminal is running — use readiness-based injection
      window.runnio.terminal.injectWhenReady(id, prompt)
    } else {
      // Terminal not ready yet — store for later injection
      pendingPromptRef.current = prompt
    }
  }, [initialPrompt, id])

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%',
      height: '100%',
      minHeight: '200px',
      backgroundColor: '#0d1117',
      padding: '4px 4px 0 4px',
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
    },
  })
}

export default Terminal
