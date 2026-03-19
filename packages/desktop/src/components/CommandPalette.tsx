import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { store } from '../store/index'
import { useStore } from '../hooks/useStore'

interface Props {
  onClose: () => void
  onOpenLocal: () => void
  onOpenClone: () => void
}

interface PaletteItem {
  id: string
  icon: string
  label: string
  sublabel: string
  action: () => void
}

const CommandPalette: React.FC<Props> = ({ onClose, onOpenLocal, onOpenClone }) => {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const recents = useStore(s => s.recentProjects)
  const worktrees = useStore(s => s.worktrees)
  const statuses = useStore(s => s.agentStatuses)

  useEffect(() => { inputRef.current?.focus() }, [])

  const items: PaletteItem[] = React.useMemo(() => {
    const list: PaletteItem[] = []

    // Recent projects
    recents.forEach(p => {
      const name = p.split(/[\\/]/).pop() || p
      list.push({
        id: `proj-${p}`, icon: '\uD83D\uDCC1', label: name, sublabel: p,
        action: async () => {
          try {
            const config = await window.agentflow.config.load(p)
            store.getState().setConfig(config)
            store.getState().setRootPath(p)
            store.getState().addRecentProject(p)
          } catch {}
          onClose()
        },
      })
    })

    // Active worktrees
    worktrees.forEach(wt => {
      const status = statuses[wt.path] || 'idle'
      const icon = status === 'working' ? '\u25CF' : status === 'waiting' ? '\u25CF' : '\u25CB'
      list.push({
        id: `wt-${wt.path}`, icon, label: wt.branch || 'detached', sublabel: status,
        action: () => { store.getState().selectWorktree(wt.path); onClose() },
      })
    })

    // Actions
    list.push({ id: 'clone', icon: '\u2B07', label: 'Clonar reposit\u00F3rio', sublabel: 'Baixar do GitHub', action: () => { onOpenClone(); onClose() } })
    list.push({ id: 'open', icon: '\uD83D\uDCC1', label: 'Abrir pasta local', sublabel: 'Selecionar diret\u00F3rio', action: () => { onOpenLocal(); onClose() } })

    return list
  }, [recents, worktrees, statuses, onClose, onOpenLocal, onOpenClone])

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
        backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: '10px',
        width: '480px', overflow: 'hidden', animation: 'fadeIn 0.12s ease-out',
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
      // Search input
      React.createElement('div', {
        style: { padding: '12px 16px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: '10px' },
      },
        React.createElement('span', { style: { color: '#555', fontSize: '14px' } }, '\uD83D\uDD0D'),
        React.createElement('input', {
          ref: inputRef, value: query,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: 'Buscar projeto ou workspace...',
          style: {
            flex: 1, background: 'transparent', border: 'none', color: '#ededed',
            fontSize: '14px', outline: 'none',
          },
        })
      ),
      // Results
      React.createElement('div', {
        style: { maxHeight: '320px', overflowY: 'auto' as const },
      },
        filtered.length === 0
          ? React.createElement('div', {
              style: { padding: '16px', color: '#555', fontSize: '13px', textAlign: 'center' as const },
            }, 'Nenhum resultado')
          : filtered.slice(0, 8).map((item, i) =>
              React.createElement('button', {
                key: item.id,
                onClick: item.action,
                style: {
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 16px', background: i === selectedIdx ? '#1f1f1f' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'background 0.05s',
                },
                onMouseEnter: () => setSelectedIdx(i),
              },
                React.createElement('span', { style: { fontSize: '14px', width: '20px', textAlign: 'center' as const } }, item.icon),
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('div', { style: { color: '#ededed', fontSize: '13px' } }, item.label),
                  React.createElement('div', { style: { color: '#555', fontSize: '11px' } }, item.sublabel),
                ),
              )
            )
      )
    )
  )
}

export default CommandPalette
