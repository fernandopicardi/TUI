import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Check } from 'lucide-react'

interface Props {
  branch: string
  rootPath: string
}

const WorkspaceNotes: React.FC<Props> = ({ branch, rootPath }) => {
  const repoName = rootPath.split(/[\\/]/).pop() || 'unknown'
  const storageKey = `runnio:notes-${branch}-${repoName}`
  const [text, setText] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load
  useEffect(() => {
    try { setText(localStorage.getItem(storageKey) || '') } catch {}
  }, [storageKey])

  // Update "saved ago" timer
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(storageKey, val) } catch {}
      setSavedAt(Date.now())
    }, 1000)
  }, [storageKey])

  const elapsed = savedAt ? Math.floor((now - savedAt) / 1000) : null

  return React.createElement('div', {
    style: { height: '100%', display: 'flex', flexDirection: 'column' as const, padding: '16px' },
  },
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    },
      React.createElement('span', {
        style: { color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' },
      }, `Notes \u2014 ${branch}`),
      elapsed !== null
        ? React.createElement('span', {
            style: { color: 'var(--working)', fontSize: 'var(--text-xs)' },
          }, elapsed < 2 ? React.createElement(React.Fragment, null, 'saved ', React.createElement(Check, { size: 10 })) : React.createElement(React.Fragment, null, `saved ${elapsed}s ago `, React.createElement(Check, { size: 10 })))
        : null
    ),
    React.createElement('textarea', {
      value: text,
      onChange: handleChange,
      placeholder: 'Add notes for this workspace...',
      style: {
        flex: 1, padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: 'var(--text-base)', lineHeight: '1.6',
        resize: 'none' as const, outline: 'none', fontFamily: 'inherit',
      },
    })
  )
}

export default WorkspaceNotes
