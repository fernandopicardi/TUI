// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useEffect, useRef, useCallback, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { rust } from '@codemirror/lang-rust'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'

const runnioTheme = EditorView.theme({
  '&': { backgroundColor: 'var(--bg-app)', height: '100%' },
  '.cm-content': { caretColor: 'var(--accent)', fontFamily: 'Consolas, monospace', fontSize: '13px' },
  '.cm-gutters': { backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--bg-elevated)' },
  '.cm-activeLine': { backgroundColor: 'var(--bg-elevated)' },
  '.cm-selectionBackground': { backgroundColor: 'var(--accent)33 !important' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)' },
  '.cm-scroller': { overflow: 'auto' },
})

function getLanguageExtension(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, any> = {
    ts: javascript({ typescript: true }),
    tsx: javascript({ jsx: true, typescript: true }),
    js: javascript(),
    jsx: javascript({ jsx: true }),
    py: python(),
    css: css(),
    json: json(),
    md: markdown(),
    rs: rust(),
    java: java(),
    cpp: cpp(),
    c: cpp(),
    html: html(),
    htm: html(),
  }
  return map[ext ?? ''] ?? null
}

interface Props {
  filePath: string
  content: string
  onSave: (content: string) => void
}

const FileEditor: React.FC<Props> = ({ filePath, content, onSave }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const debounceRef = useRef<any>(null)
  const [saved, setSaved] = useState(false)

  const handleChange = useCallback((newContent: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSave(newContent)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 1000)
  }, [onSave])

  useEffect(() => {
    if (!containerRef.current) return

    // Clean up previous editor
    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }

    const extensions = [
      keymap.of([...defaultKeymap, ...historyKeymap]),
      history(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      oneDark,
      runnioTheme,
      EditorView.lineWrapping,
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          handleChange(update.state.doc.toString())
        }
      }),
    ]

    const langExt = getLanguageExtension(filePath)
    if (langExt) extensions.push(langExt)

    const state = EditorState.create({
      doc: content,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      view.destroy()
    }
  }, [filePath, content]) // Re-create editor when file changes

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', position: 'relative' as const },
  },
    // File path header
    React.createElement('div', {
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)',
        fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0,
      },
    },
      React.createElement('span', {
        style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, fontFamily: 'Consolas, monospace' },
      }, filePath),
      saved ? React.createElement('span', {
        style: { color: 'var(--working)', fontSize: 'var(--text-xs)', marginLeft: '8px', flexShrink: 0 },
      }, 'Saved') : null,
    ),
    // Editor container
    React.createElement('div', {
      ref: containerRef,
      style: { flex: 1, overflow: 'hidden' },
    }),
  )
}

export default FileEditor
