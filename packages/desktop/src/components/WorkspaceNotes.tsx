import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  branch: string
  rootPath: string
}

const WorkspaceNotes: React.FC<Props> = ({ branch, rootPath }) => {
  const repoName = rootPath.split(/[\\/]/).pop() || 'unknown'
  const storageKey = `agentflow:notes-${branch}-${repoName}`
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
        style: { color: '#888', fontSize: '12px' },
      }, `Notas \u2014 ${branch}`),
      elapsed !== null
        ? React.createElement('span', {
            style: { color: '#22c55e', fontSize: '11px' },
          }, elapsed < 2 ? 'salvo agora \u2713' : `salvo h\u00E1 ${elapsed}s \u2713`)
        : null
    ),
    React.createElement('textarea', {
      value: text,
      onChange: handleChange,
      placeholder: 'Anota\u00E7\u00F5es sobre este workspace...\n\nHip\u00F3teses, TODOs, contexto...',
      style: {
        flex: 1, padding: '12px', background: '#111', border: '1px solid #1f1f1f',
        borderRadius: '8px', color: '#ededed', fontSize: '13px', lineHeight: '1.6',
        resize: 'none' as const, outline: 'none', fontFamily: 'inherit',
      },
    })
  )
}

export default WorkspaceNotes
