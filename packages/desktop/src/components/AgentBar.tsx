import * as React from 'react'
import { useStore } from '../store/index'
import AgentStatusBadge from './AgentStatusBadge'
import { AlertTriangle, Plus, Globe } from 'lucide-react'

const AgentBar: React.FC = () => {
  const projects = useStore(s => s.projects)
  const activeAgentId = useStore(s => s.activeAgentId)
  const allAgents = projects.flatMap(p => p.agents)

  const working = allAgents.filter(a => a.status === 'working').length
  const waiting = allAgents.filter(a => a.status === 'waiting').length

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'unknown'
  }

  const getTimeSince = (lastActivity?: number) => {
    if (!lastActivity) return ''
    const seconds = Math.floor((Date.now() - lastActivity) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  if (allAgents.length === 0) {
    return React.createElement('div', {
      style: {
        height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px', borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-app)', flexShrink: 0, gap: '12px',
      },
    },
      React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-sm)' } },
        'No active agents'),
      React.createElement('button', {
        onClick: () => useStore.getState().openCreateAgent(),
        style: {
          padding: '4px 12px', background: 'var(--accent)', border: 'none',
          borderRadius: 'var(--radius-sm)', color: '#fff',
          fontSize: 'var(--text-xs)', cursor: 'pointer', transition: 'opacity 100ms',
          display: 'flex', alignItems: 'center', gap: '4px',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
      }, React.createElement(Plus, { size: 12 }), 'New agent')
    )
  }

  return React.createElement('div', {
    style: {
      minHeight: '64px', display: 'flex', alignItems: 'center',
      padding: '8px 16px', gap: '8px', borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-app)', flexShrink: 0, overflowX: 'auto' as const,
    },
  },
    // Status summary
    React.createElement('div', {
      style: {
        display: 'flex', flexDirection: 'column' as const, gap: '2px',
        minWidth: '90px', flexShrink: 0,
      },
    },
      working > 0
        ? React.createElement('span', { style: { color: 'var(--working)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' } },
            React.createElement('span', { style: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--working)', animation: 'pulse 2s infinite' } }),
            `${working} working`)
        : null,
      waiting > 0
        ? React.createElement('span', { style: { color: 'var(--waiting)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' } },
            React.createElement(AlertTriangle, { size: 10 }),
            `${waiting} waiting`)
        : null,
      working === 0 && waiting === 0
        ? React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' } }, `${allAgents.length} idle`)
        : null,
    ),

    // Agent cards
    ...allAgents.map(agent => {
      const isActive = agent.id === activeAgentId
      const isAttention = agent.status === 'waiting' && agent.lastActivity
        && (Date.now() - agent.lastActivity) > 120000

      const statusBorderColor = agent.status === 'working' ? 'var(--working)'
        : agent.status === 'waiting' ? 'var(--waiting)'
        : agent.status === 'done' ? 'var(--done)'
        : 'transparent'

      return React.createElement('button', {
        key: agent.id,
        onClick: () => useStore.getState().setActiveAgent(agent.id),
        style: {
          display: 'flex', flexDirection: 'column' as const, gap: '2px',
          padding: '6px 12px', minWidth: '160px', maxWidth: '220px',
          background: isActive ? 'var(--bg-selected)' : isAttention ? 'rgba(251,191,36,0.05)' : 'transparent',
          border: isAttention
            ? '1px solid var(--waiting)'
            : '1px solid ' + (isActive ? '#6366f144' : 'var(--border-default)'),
          borderLeft: `3px solid ${statusBorderColor}`,
          borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left' as const,
          transition: 'all 150ms', flexShrink: 0,
          animation: isAttention ? 'pulsingBorder 2s infinite' : 'none',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          if (!isActive) e.currentTarget.style.background = isAttention ? 'rgba(251,191,36,0.05)' : 'transparent'
        },
      },
        React.createElement('span', {
          style: { color: 'var(--text-secondary)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
        }, getProjectName(agent.projectId)),
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '6px' },
        },
          React.createElement(AgentStatusBadge, { status: agent.status }),
          React.createElement('span', {
            style: {
              color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Consolas, monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              maxWidth: '120px',
            },
          }, agent.branch),
        ),
        React.createElement('span', {
          style: { color: 'var(--text-tertiary)', fontSize: '11px' },
        }, getTimeSince(agent.lastActivity) || '\u00A0'),
      )
    }),

    // New agent button
    React.createElement('button', {
      onClick: () => useStore.getState().openCreateAgent(),
      style: {
        padding: '6px 12px', background: 'transparent',
        border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
        fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 150ms',
        flexShrink: 0, height: '44px', display: 'flex', alignItems: 'center', gap: '4px',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.color = 'var(--accent)'
      },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = 'var(--border-default)'
        e.currentTarget.style.color = 'var(--text-tertiary)'
      },
    }, React.createElement(Plus, { size: 12 }), 'agent'),

    // Global Terminal button
    React.createElement('button', {
      onClick: () => useStore.getState().openGlobalTerminalModal(),
      title: 'Global terminal \u2014 access multiple projects',
      style: {
        padding: '6px 12px', background: 'transparent',
        border: '1px dashed #fbbf2444', borderRadius: 'var(--radius-md)', color: 'var(--waiting)',
        fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 150ms',
        flexShrink: 0, height: '44px', display: 'flex', alignItems: 'center', gap: '4px',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = 'var(--waiting)'
        e.currentTarget.style.background = 'rgba(251,191,36,0.05)'
      },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = '#fbbf2444'
        e.currentTarget.style.background = 'transparent'
      },
    }, React.createElement(Globe, { size: 12 }), 'Global'),
  )
}

export default AgentBar
