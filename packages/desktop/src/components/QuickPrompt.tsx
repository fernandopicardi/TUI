import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/index'
import { PROMPT_TEMPLATES } from '../data/promptTemplates'

const HISTORY_KEY = 'agentflow:prompt-history'
const MAX_HISTORY = 20

type BroadcastMode = 'active' | 'project' | 'all'

function getHistory(): { prompt: string; ts: string }[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(prompt: string) {
  const h = getHistory()
  const updated = [{ prompt, ts: new Date().toISOString() }, ...h.filter(x => x.prompt !== prompt)].slice(0, MAX_HISTORY)
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)) } catch {}
}

const QuickPrompt: React.FC = () => {
  const [value, setValue] = useState('')
  const [histIdx, setHistIdx] = useState(-1)
  const [broadcastMode, setBroadcastMode] = useState<BroadcastMode>('active')
  const inputRef = useRef<HTMLInputElement>(null)

  const activeAgent = useStore(s => s.getActiveAgent())
  const activeProject = useStore(s => s.getActiveProject())
  const allAgents = useStore(s => s.projects.flatMap(p => p.agents))

  const targetAgent = activeAgent || allAgents[0]
  const targetProjectName = activeProject?.name || 'no project'
  const branchName = targetAgent?.branch || '...'

  const projectAgents = activeProject?.agents ?? []
  const showBroadcast = allAgents.length > 1

  const pluginName = activeProject?.plugin || 'all'
  const templates = PROMPT_TEMPLATES.filter(t => t.plugin === pluginName || t.plugin === 'all')

  useEffect(() => { inputRef.current?.focus() }, [])

  const onClose = useCallback(() => {
    useStore.getState().closeQuickPrompt()
  }, [])

  const handleSend = useCallback(async () => {
    const prompt = value.trim()
    if (!prompt) return

    const targets = broadcastMode === 'all'
      ? allAgents
      : broadcastMode === 'project'
        ? projectAgents
        : [targetAgent].filter(Boolean)

    if (targets.length === 0) return

    saveHistory(prompt)

    for (const agent of targets) {
      if (agent) {
        await window.agentflow.terminal.injectWhenReady(agent.terminalId, prompt)
      }
    }

    if (targets.length > 1) {
      useStore.getState().showToast(`Broadcast sent to ${targets.length} agents`, 'success')
    } else if (targets.length === 1 && targets[0]) {
      useStore.getState().setActiveAgent(targets[0].id)
    }

    onClose()
  }, [value, broadcastMode, targetAgent, allAgents, projectAgents, onClose])

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

  const getTargetCount = () => {
    if (broadcastMode === 'all') return allAgents.length
    if (broadcastMode === 'project') return projectAgents.length
    return 1
  }

  const radioStyle = (mode: BroadcastMode): React.CSSProperties => ({
    padding: '4px 10px', background: broadcastMode === mode ? 'var(--bg-selected)' : 'transparent',
    border: broadcastMode === mode ? '1px solid var(--accent)' : '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)', color: broadcastMode === mode ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontSize: 'var(--text-xs)', cursor: 'pointer', transition: 'all 100ms',
  })

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
        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--accent)', borderRadius: '10px',
        padding: '16px 20px', width: '520px', animation: 'fadeIn 0.12s ease-out',
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
      // Header
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
      },
        React.createElement('span', { style: { color: 'var(--accent)', fontSize: 'var(--text-base)' } }, '\u26A1'),
        React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500 } }, 'Quick Prompt'),
      ),

      // Broadcast selector
      showBroadcast
        ? React.createElement('div', {
            style: { marginBottom: '12px' },
          },
            React.createElement('div', {
              style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: '6px' },
            }, 'Send to'),
            React.createElement('div', {
              style: { display: 'flex', gap: '6px', marginBottom: '6px' },
            },
              React.createElement('button', {
                onClick: () => setBroadcastMode('active'),
                style: radioStyle('active'),
              }, `${branchName} (active)`),
              projectAgents.length > 1
                ? React.createElement('button', {
                    onClick: () => setBroadcastMode('project'),
                    style: radioStyle('project'),
                  }, `${targetProjectName} (${projectAgents.length})`)
                : null,
              React.createElement('button', {
                onClick: () => setBroadcastMode('all'),
                style: radioStyle('all'),
              }, `All agents (${allAgents.length})`),
            ),
            getTargetCount() > 1
              ? React.createElement('div', {
                  style: { color: 'var(--waiting)', fontSize: 'var(--text-xs)' },
                }, `\u26A0 Sends to ${getTargetCount()} agents simultaneously`)
              : null,
          )
        : React.createElement('div', {
            style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
          },
            React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' } }, targetProjectName),
            React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-sm)' } }, '/'),
            React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'Consolas, monospace' } }, branchName),
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
                  padding: '3px 10px', background: 'var(--bg-selected)', border: '1px solid #5b6af033',
                  borderRadius: '12px', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer',
                  transition: 'all 100ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#5b6af033' },
              }, t.label)
            )
          )
        : null,

      // Input
      React.createElement('input', {
        ref: inputRef, value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setValue(e.target.value); setHistIdx(-1) },
        onKeyDown: handleKeyDown,
        placeholder: 'Type a prompt for the agent...',
        style: {
          width: '100%', padding: '10px 14px', background: '#0a0a0a',
          border: '1px solid var(--text-disabled)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)',
          fontSize: 'var(--text-base)', outline: 'none', fontFamily: 'inherit',
          boxSizing: 'border-box',
        },
      }),

      // Footer
      React.createElement('div', {
        style: { display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'flex-end' },
      },
        React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' } }, '\u21B5 Send'),
        React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' } }, 'Esc Close'),
        React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' } }, '\u2191\u2193 History'),
      )
    )
  )
}

export default QuickPrompt
