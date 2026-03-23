import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../hooks/useStore'
import { AgentSession } from '../types'

interface Props {
  currentAgentId: string
  anchorRef: React.RefObject<HTMLElement>
  onSelect: (agent: AgentSession) => void
  onClose: () => void
}

interface AgentWithProject extends AgentSession {
  projectName: string
  projectId: string
}

interface ProjectGroup {
  projectId: string
  projectName: string
  isSameProject: boolean
  agents: AgentWithProject[]
}

const SplitTerminalSelector: React.FC<Props> = ({ currentAgentId, anchorRef, onSelect, onClose }) => {
  const projects = useStore(s => s.projects)
  const [search, setSearch] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  // Find current agent's project
  const currentProjectId = (() => {
    for (const p of projects) {
      if (p.agents.some(a => a.id === currentAgentId)) return p.id
    }
    return null
  })()

  // Collect all other launched agents with project info
  const otherAgents: AgentWithProject[] = []
  for (const p of projects) {
    for (const a of p.agents) {
      if (a.id !== currentAgentId && a.hasLaunched) {
        otherAgents.push({ ...a, projectName: p.name, projectId: p.id })
      }
    }
  }

  // Filter by search
  const filtered = search.trim()
    ? otherAgents.filter(a =>
        a.branch.toLowerCase().includes(search.toLowerCase()) ||
        a.projectName.toLowerCase().includes(search.toLowerCase())
      )
    : otherAgents

  // Group by project, same project first
  const grouped: ProjectGroup[] = (() => {
    const map = new Map<string, ProjectGroup>()
    for (const a of filtered) {
      let group = map.get(a.projectId)
      if (!group) {
        group = {
          projectId: a.projectId,
          projectName: a.projectName,
          isSameProject: a.projectId === currentProjectId,
          agents: [],
        }
        map.set(a.projectId, group)
      }
      group.agents.push(a)
    }
    // Sort: same project first, then alphabetically
    return Array.from(map.values()).sort((a, b) => {
      if (a.isSameProject && !b.isSameProject) return -1
      if (!a.isSameProject && b.isSameProject) return 1
      return a.projectName.localeCompare(b.projectName)
    })
  })()

  // Flat list for keyboard navigation
  const flatFiltered = grouped.flatMap(g => g.agents)

  // Clamp selected index
  useEffect(() => {
    if (selectedIdx >= flatFiltered.length) setSelectedIdx(Math.max(0, flatFiltered.length - 1))
  }, [flatFiltered.length])

  // Position popover below anchor
  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.right - 320, window.innerWidth - 340),
      })
    }
  }, [anchorRef.current])

  // Focus search on mount
  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, flatFiltered.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (flatFiltered[selectedIdx]) onSelect(flatFiltered[selectedIdx])
      return
    }
  }, [flatFiltered, selectedIdx, onSelect, onClose])

  const statusDot = (status: string): React.CSSProperties => ({
    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
    backgroundColor:
      status === 'working' ? 'var(--working)' :
      status === 'waiting' ? 'var(--waiting)' :
      status === 'done' ? 'var(--done)' :
      'var(--text-disabled)',
    animation:
      status === 'working' ? 'pulse 2s infinite' :
      status === 'waiting' ? 'pulseFast 1s infinite' :
      'none',
  })

  // Map flat index for a given agent
  const getFlatIndex = (agent: AgentWithProject): number => {
    return flatFiltered.findIndex(a => a.id === agent.id)
  }

  if (!position) return null

  return React.createElement('div', {
    ref: panelRef,
    onKeyDown: handleKeyDown,
    style: {
      position: 'fixed' as const,
      top: position.top,
      left: position.left,
      width: '320px',
      maxHeight: '420px',
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      animation: 'fadeIn 0.12s ease-out',
    },
  },
    // Header
    React.createElement('div', {
      style: {
        padding: '12px 14px 8px',
        borderBottom: '1px solid var(--border-subtle)',
      },
    },
      React.createElement('div', {
        style: {
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        },
      },
        // Split icon (two columns)
        React.createElement('svg', {
          width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none',
          style: { color: 'var(--accent)' },
        },
          React.createElement('rect', { x: 1, y: 1, width: 6, height: 14, rx: 1.5, stroke: 'currentColor', strokeWidth: 1.5 }),
          React.createElement('rect', { x: 9, y: 1, width: 6, height: 14, rx: 1.5, stroke: 'currentColor', strokeWidth: 1.5 }),
        ),
        'Split terminal with...',
      ),
      // Search input
      React.createElement('input', {
        ref: searchRef,
        type: 'text',
        value: search,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setSelectedIdx(0) },
        placeholder: 'Search agents...',
        style: {
          width: '100%',
          padding: '6px 10px',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          outline: 'none',
          fontFamily: 'inherit',
        },
      }),
    ),

    // Agent list grouped by project
    flatFiltered.length === 0
      ? React.createElement('div', {
          style: {
            padding: '24px 14px',
            textAlign: 'center' as const,
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
          },
        }, otherAgents.length === 0
          ? 'No other launched agents available'
          : 'No agents match your search'
        )
      : React.createElement('div', {
          style: {
            flex: 1,
            overflowY: 'auto' as const,
            padding: '4px',
          },
        },
          ...grouped.flatMap((group, gi) => {
            const elements: React.ReactElement[] = []

            // Project section header
            elements.push(
              React.createElement('div', {
                key: `header-${group.projectId}`,
                style: {
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: gi === 0 ? '6px 10px 4px' : '10px 10px 4px',
                  fontSize: '10px', fontWeight: 600,
                  color: 'var(--text-disabled)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                },
              },
                React.createElement('span', null, group.projectName),
                group.isSameProject
                  ? React.createElement('span', {
                      style: {
                        fontSize: '9px', padding: '0px 5px',
                        borderRadius: '8px',
                        background: 'rgba(99,102,241,0.1)',
                        color: 'var(--accent)',
                        fontWeight: 500,
                        letterSpacing: '0',
                        textTransform: 'none' as const,
                      },
                    }, 'current')
                  : null,
              )
            )

            // Agents in this group
            for (const agent of group.agents) {
              const flatIdx = getFlatIndex(agent)
              const isSelected = flatIdx === selectedIdx

              elements.push(
                React.createElement('button', {
                  key: agent.id,
                  onClick: () => onSelect(agent),
                  onMouseEnter: () => setSelectedIdx(flatIdx),
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '7px 10px',
                    background: isSelected ? 'var(--bg-hover)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    transition: 'background 80ms',
                    borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                  },
                },
                  // Status dot
                  React.createElement('span', { style: statusDot(agent.status) }),
                  // Agent info
                  React.createElement('div', {
                    style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: '1px' },
                  },
                    React.createElement('span', {
                      style: {
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                        fontFamily: '"Cascadia Code", Consolas, monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      },
                    }, agent.branch),
                  ),
                  // Status label
                  React.createElement('span', {
                    style: {
                      fontSize: '10px',
                      color:
                        agent.status === 'working' ? 'var(--working)' :
                        agent.status === 'waiting' ? 'var(--waiting)' :
                        agent.status === 'done' ? 'var(--done)' :
                        'var(--text-disabled)',
                      flexShrink: 0,
                      textTransform: 'capitalize' as const,
                    },
                  }, agent.status),
                )
              )
            }

            return elements
          })
        ),

    // Footer hint
    React.createElement('div', {
      style: {
        padding: '6px 14px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: '12px',
        fontSize: '10px',
        color: 'var(--text-disabled)',
      },
    },
      React.createElement('span', null, '\u2191\u2193 navigate'),
      React.createElement('span', null, '\u21B5 select'),
      React.createElement('span', null, 'esc close'),
    ),
  )
}

export default SplitTerminalSelector
