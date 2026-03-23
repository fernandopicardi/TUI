import * as React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { CanvasAddon } from '@xterm/addon-canvas'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { ClipboardAddon } from '@xterm/addon-clipboard'

interface Props {
  id: string
  worktreePath: string
  openCommand?: string
  initialPrompt?: string
}

// Professional dark theme — matches app design system
const TERMINAL_THEME = {
  background: '#0a0a0a',
  foreground: '#e4e4e7',
  cursor: '#6366f1',
  cursorAccent: '#0a0a0a',
  selectionBackground: '#6366f140',
  selectionForeground: '#ffffff',
  selectionInactiveBackground: '#6366f120',
  // ANSI colors (balanced for readability)
  black: '#18181b',
  red: '#f87171',
  green: '#4ade80',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  magenta: '#c084fc',
  cyan: '#22d3ee',
  white: '#e4e4e7',
  brightBlack: '#52525b',
  brightRed: '#fca5a5',
  brightGreen: '#86efac',
  brightYellow: '#fde68a',
  brightBlue: '#93c5fd',
  brightMagenta: '#d8b4fe',
  brightCyan: '#67e8f9',
  brightWhite: '#fafafa',
}

// Font stack — prioritize modern monospace fonts, cross-platform
const FONT_FAMILY = [
  '"Cascadia Code"',    // Windows 11 / VS Code default
  '"JetBrains Mono"',   // Popular dev font
  '"Fira Code"',        // Ligature-rich alternative
  'Menlo',              // macOS default
  'Consolas',           // Windows fallback
  '"DejaVu Sans Mono"', // Linux fallback
  'monospace',
].join(', ')

const Terminal: React.FC<Props> = ({ id, worktreePath, openCommand = 'claude', initialPrompt }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const initializedRef = useRef(false)
  const terminalReadyRef = useRef(false)
  const pendingPromptRef = useRef<string | null>(null)
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced resize — prevents excessive resize calls during drag
  const debouncedResize = useCallback((xterm: XTerm, fitAddon: FitAddon, termId: string) => {
    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
    resizeTimerRef.current = setTimeout(() => {
      try {
        fitAddon.fit()
        window.runnio.terminal.resize(termId, xterm.cols, xterm.rows)
      } catch {}
    }, 50)
  }, [])

  // Main effect: create xterm + connect to pty (runs once per id)
  useEffect(() => {
    if (!containerRef.current || !window.runnio?.terminal || !id) return
    if (initializedRef.current) return
    initializedRef.current = true
    terminalReadyRef.current = false

    let isMounted = true

    const init = async () => {
      const xterm = new XTerm({
        theme: TERMINAL_THEME,
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        fontWeight: '400',
        fontWeightBold: '600',
        lineHeight: 1.3,
        letterSpacing: 0,
        cursorBlink: true,
        cursorStyle: 'bar',
        cursorWidth: 2,
        cursorInactiveStyle: 'outline',
        scrollback: 10000,
        smoothScrollDuration: 100,
        fastScrollModifier: 'alt',
        fastScrollSensitivity: 5,
        allowProposedApi: true,
        macOptionIsMeta: true,
        macOptionClickForcesSelection: true,
        rightClickSelectsWord: true,
        drawBoldTextInBrightColors: true,
        minimumContrastRatio: 4.5,
        overviewRulerWidth: 12,
      })

      // ── Load addons ──

      // Fit addon (auto-sizing)
      const fitAddon = new FitAddon()
      xterm.loadAddon(fitAddon)

      // Unicode11 (emoji and wide character support)
      const unicode11 = new Unicode11Addon()
      xterm.loadAddon(unicode11)
      xterm.unicode.activeVersion = '11'

      // Web links (clickable URLs)
      xterm.loadAddon(new WebLinksAddon((_event, uri) => {
        // Open links in default browser via Electron shell
        window.open(uri, '_blank')
      }, {
        urlRegex: /https?:\/\/[^\s"'`)\]}>]+/g,
      }))

      // Clipboard addon (OSC 52 clipboard integration)
      xterm.loadAddon(new ClipboardAddon())

      // Open terminal in DOM
      xterm.open(containerRef.current!)

      // Initial fit after DOM attachment
      await new Promise(r => setTimeout(r, 30))
      fitAddon.fit()

      // ── GPU-accelerated rendering ──
      // Try WebGL first (fastest), fall back to Canvas, then DOM (default)
      try {
        const webglAddon = new WebglAddon()
        webglAddon.onContextLoss(() => {
          console.warn('[runnio] WebGL context lost — falling back to canvas renderer')
          webglAddon.dispose()
          try {
            xterm.loadAddon(new CanvasAddon())
          } catch {
            console.warn('[runnio] Canvas fallback failed — using DOM renderer')
          }
        })
        xterm.loadAddon(webglAddon)
      } catch {
        // WebGL not available — try Canvas
        try {
          xterm.loadAddon(new CanvasAddon())
        } catch {
          // DOM renderer is the built-in default — no action needed
          console.warn('[runnio] GPU renderers unavailable — using DOM renderer')
        }
      }

      if (!isMounted) { xterm.dispose(); return }

      xtermRef.current = xterm
      fitAddonRef.current = fitAddon

      // ── Paste handling (cross-platform) ──
      let pasteHandled = false

      xterm.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        // Ctrl+V (Windows/Linux) or Cmd+V (macOS)
        if (e.type === 'keydown' && (e.ctrlKey || e.metaKey) && e.key === 'v') {
          pasteHandled = true
          navigator.clipboard.readText().then(text => {
            if (text) window.runnio.terminal.input(id, text)
          }).catch(() => {})
          setTimeout(() => { pasteHandled = false }, 100)
          return false
        }
        // Ctrl+C — let xterm handle copy when there's a selection
        if (e.type === 'keydown' && (e.ctrlKey || e.metaKey) && e.key === 'c') {
          if (xterm.hasSelection()) {
            navigator.clipboard.writeText(xterm.getSelection()).catch(() => {})
            xterm.clearSelection()
            return false
          }
          // No selection — send SIGINT to pty
          return true
        }
        return true
      })

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
        xterm.write('\r\n\x1b[38;5;243m[runnio] session reconnected\x1b[0m\r\n')
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

      // Handle right-click / context-menu paste (skip if already handled)
      containerRef.current!.addEventListener('paste', (e: ClipboardEvent) => {
        e.preventDefault()
        if (pasteHandled) return
        const text = e.clipboardData?.getData('text')
        if (text) window.runnio.terminal.input(id, text)
      })

      // Debounced auto-resize via ResizeObserver
      const resizeObserver = new ResizeObserver(() => {
        if (!isMounted || !fitAddonRef.current || !xtermRef.current) return
        debouncedResize(xtermRef.current, fitAddonRef.current, id)
      })
      resizeObserver.observe(containerRef.current!)

      cleanupRef.current = () => {
        removeOutput?.()
        resizeObserver.disconnect()
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
    }
  }, [id])

  // Separate effect: inject prompt into EXISTING terminal when initialPrompt changes
  useEffect(() => {
    if (!initialPrompt || !id) return

    const prompt = initialPrompt

    if (terminalReadyRef.current) {
      window.runnio.terminal.injectWhenReady(id, prompt)
    } else {
      pendingPromptRef.current = prompt
    }
  }, [initialPrompt, id])

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%',
      height: '100%',
      minHeight: '200px',
      backgroundColor: '#0a0a0a',
      padding: '2px',
      borderRadius: '4px',
      overflow: 'hidden',
    },
  })
}

export default Terminal
