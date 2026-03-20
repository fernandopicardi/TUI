import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/index'

interface PaletteItem {
  id: string
  icon: string
  label: string
  sublabel: string
  action: () => void
}

const CommandPalette: React.FC = () => {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const projects = useStore(s => s.projects)
  const allAgents = projects.flatMap(p => p.agents)

  useEffect(() => { inputRef.current?.focus() }, [])

  const onClose = useCallback(() => {
    useStore.getState().closeCommandPalette()
  }, [])

  const items: PaletteItem[] = React.useMemo(() => {
    const list: PaletteItem[] = []

    allAgents.forEach(agent => {
      const projectName = projects.find(p => p.id === agent.projectId)?.name || ''
      const statusIcon = agent.status === 'working' ? '\u25CF'
        : agent.status === 'waiting' ? '\u26A0'
        : agent.status === 'done' ? '\u2713'
        : '\u25CB'
      list.push({
        id: `agent-${agent.id}`,
        icon: statusIcon,
        label: `${projectName} / ${agent.branch}`,
        sublabel: agent.status,
        action: () => { useStore.getState().setActiveAgent(agent.id); onClose() },
      })
    })

    projects.forEach(p => {
      list.push({
        id: `proj-${p.id}`,
        icon: '\u25C6',
        label: p.name,
        sublabel: `${p.agents.length} agent(s) \u2014 ${p.plugin}`,
        action: () => { useStore.getState().setActiveProject(p.id); onClose() },
      })
    })

    list.push({
      id: 'add-project', icon: '+', label: 'Add project', sublabel: 'Open local folder or clone',
      action: () => { useStore.getState().openAddProject(); onClose() },
    })
    list.push({
      id: 'new-agent', icon: '+', label: 'New agent', sublabel: 'Create agent in active project',
      action: () => { useStore.getState().openCreateAgent(); onClose() },
    })
    list.push({
      id: 'settings', icon: '\u2699', label: 'Settings', sublabel: 'Ctrl+,',
      action: () => { useStore.getState().openSettings(); onClose() },
    })
    list.push({
      id: 'quick-prompt', icon: '\u26A1', label: 'Quick Prompt', sublabel: 'Ctrl+Space',
      action: () => { useStore.getState().openQuickPrompt(); onClose() },
    })

    return list
  }, [projects, allAgents, onClose])

  const filtered = query
    ? items.filter(i => (i.label + i.sublabel).toLowerCase().includes(query.toLowerCase()))
    : items

  useEffect(() => { setSelectedIdx(0) }, [query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter' && filtered[selectedIdx]) { filtered[selectedIdx].action(); return }
  }, [filtered, selectedIdx, onClose])

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', zIndex: 200,
    },
    onClick: onClose,
  },
    React.createElement('div', {
      style: {
        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px',
        width: '480px', overflow: 'hidden', animation: 'fadeIn 0.12s ease-out',
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
      // Search input
      React.createElement('div', {
        style: { padding: '12px 16px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '10px' },
      },
        React.createElement('span', { style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-md)' } }, '\u2315'),
        React.createElement('input', {
          ref: inputRef, value: query,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: 'Search project, agent, or action...',
          style: {
            flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)',
            fontSize: 'var(--text-md)', outline: 'none',
          },
        })
      ),
      // Results
      React.createElement('div', {
        style: { maxHeight: '320px', overflowY: 'auto' as const },
      },
        filtered.length === 0
          ? React.createElement('div', {
              style: { padding: '16px', color: 'var(--text-tertiary)', fontSize: 'var(--text-base)', textAlign: 'center' as const },
            }, 'No results')
          : filtered.slice(0, 8).map((item, i) =>
              React.createElement('button', {
                key: item.id,
                onClick: item.action,
                style: {
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 16px', background: i === selectedIdx ? 'var(--border-default)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'background 50ms',
                },
                onMouseEnter: () => setSelectedIdx(i),
              },
                React.createElement('span', {
                  style: { fontSize: 'var(--text-md)', width: '20px', textAlign: 'center' as const, color: 'var(--text-secondary)' },
                }, item.icon),
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('div', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-base)' } }, item.label),
                  React.createElement('div', { style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' } }, item.sublabel),
                ),
              )
            )
      )
    )
  )
}

export default CommandPalette
