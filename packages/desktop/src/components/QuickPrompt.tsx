import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { store } from '../store/index'
import { useStore } from '../hooks/useStore'
import { PROMPT_TEMPLATES } from '../data/promptTemplates'

interface Props {
  onClose: () => void
}

const HISTORY_KEY = 'agentflow:prompt-history'
const MAX_HISTORY = 20

function getHistory(): { prompt: string; ts: string }[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(prompt: string) {
  const h = getHistory()
  const updated = [{ prompt, ts: new Date().toISOString() }, ...h.filter(x => x.prompt !== prompt)].slice(0, MAX_HISTORY)
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)) } catch {}
}

const QuickPrompt: React.FC<Props> = ({ onClose }) => {
  const [value, setValue] = useState('')
  const [histIdx, setHistIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const pluginName = useStore(s => s.pluginName)
  const selectedId = useStore(s => s.selectedWorktreeId)
  const worktrees = useStore(s => s.worktrees)

  const selectedWt = worktrees.find(w => w.path === selectedId)
  const branchName = selectedWt?.branch || worktrees[0]?.branch || '...'

  const templates = PROMPT_TEMPLATES.filter(t => t.plugin === pluginName || t.plugin === 'all')

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSend = useCallback(() => {
    const prompt = value.trim()
    if (!prompt) return
    saveHistory(prompt)

    // Navigate to workspace if needed
    const wt = selectedId ? worktrees.find(w => w.path === selectedId) : worktrees[0]
    if (wt) {
      store.getState().setInitPrompt(prompt)
      store.getState().selectWorktree(wt.path)
    }
    onClose()
  }, [value, selectedId, worktrees, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { handleSend(); return }
    if (e.key === 'Escape') { onClose(); return }
    const history = getHistory()
    if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(next)
      setValue(history[next].prompt)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx <= 0) { setHistIdx(-1); setValue(''); return }
      const next = histIdx - 1
      setHistIdx(next)
      setValue(getHistory()[next].prompt)
    }
  }

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center', paddingTop: '20vh', zIndex: 200,
    },
    onClick: onClose,
  },
    React.createElement('div', {
      style: {
        backgroundColor: '#111', border: '1px solid #5b6af0', borderRadius: '10px',
        padding: '16px 20px', width: '520px', animation: 'fadeIn 0.12s ease-out',
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
      // Header
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
      },
        React.createElement('span', { style: { color: '#5b6af0', fontSize: '13px' } }, '\u26A1'),
        React.createElement('span', { style: { color: '#888', fontSize: '12px' } }, 'Quick prompt \u2192'),
        React.createElement('span', { style: { color: '#ededed', fontSize: '12px', fontFamily: 'Consolas, monospace' } }, branchName),
      ),
      // Template suggestions
      templates.length > 0
        ? React.createElement('div', {
            style: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '12px' },
          },
            ...templates.slice(0, 5).map(t =>
              React.createElement('button', {
                key: t.id,
                onClick: () => setValue(t.prompt),
                title: t.description,
                style: {
                  padding: '3px 10px', background: '#0d0d1a', border: '1px solid #5b6af033',
                  borderRadius: '12px', color: '#888', fontSize: '11px', cursor: 'pointer',
                  transition: 'all 0.1s',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.color = '#ededed'; (e.currentTarget).style.borderColor = '#5b6af0' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.color = '#888'; (e.currentTarget).style.borderColor = '#5b6af033' },
              }, t.label)
            )
          )
        : null,
      // Input
      React.createElement('input', {
        ref: inputRef, value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setValue(e.target.value); setHistIdx(-1) },
        onKeyDown: handleKeyDown,
        placeholder: 'Digite um prompt para o agente...',
        style: {
          width: '100%', padding: '10px 14px', background: '#0a0a0a',
          border: '1px solid #333', borderRadius: '8px', color: '#ededed',
          fontSize: '13px', outline: 'none', fontFamily: 'inherit',
        },
      }),
      // Footer
      React.createElement('div', {
        style: { display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'flex-end' },
      },
        React.createElement('span', { style: { color: '#444', fontSize: '11px' } }, '\u21B5 Enviar'),
        React.createElement('span', { style: { color: '#444', fontSize: '11px' } }, 'Esc Fechar'),
        React.createElement('span', { style: { color: '#444', fontSize: '11px' } }, '\u2191\u2193 Hist\u00F3rico'),
      )
    )
  )
}

export default QuickPrompt
