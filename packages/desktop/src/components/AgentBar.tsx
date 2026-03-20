import * as React from 'react'
import { useStore } from '../store/index'
import AgentStatusBadge from './AgentStatusBadge'

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
        height: '48px', display: 'flex', alignItems: 'center',
        padding: '0 16px', borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-app)', flexShrink: 0,
      },
    },
      React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-sm)' } },
        'No active agents \u2014 add a project to get started'),
      React.createElement('button', {
        onClick: () => useStore.getState().openCreateAgent(),
        style: {
          marginLeft: '12px', padding: '3px 10px', background: 'transparent',
          border: '1px dashed var(--text-disabled)', borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)',
          fontSize: 'var(--text-xs)', cursor: 'pointer', transition: 'all 150ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--text-disabled)'
          e.currentTarget.style.color = 'var(--text-tertiary)'
        },
      }, '+ new agent')
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
            React.createElement('span', { style: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--waiting)', animation: 'pulseFast 1s infinite' } }),
            `\u26A0 ${waiting} waiting`)
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

      const borderLeftColor = agent.status === 'working' ? 'var(--working)'
        : agent.status === 'waiting' ? 'var(--waiting)'
        : agent.status === 'done' ? 'var(--done)'
        : 'transparent'

      return React.createElement('button', {
        key: agent.id,
        onClick: () => useStore.getState().setActiveAgent(agent.id),
        style: {
          display: 'flex', flexDirection: 'column' as const, gap: '2px',
          padding: '6px 12px', minWidth: '140px',
          background: isActive ? 'var(--bg-selected)' : isAttention ? 'rgba(234,179,8,0.05)' : 'transparent',
          border: '1px solid ' + (isActive ? '#5b6af044' : isAttention ? '#eab30833' : 'var(--border-default)'),
          borderLeft: `3px solid ${borderLeftColor}`,
          borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left' as const,
          transition: 'all 150ms', flexShrink: 0,
          animation: isAttention ? 'glowWaiting 2s infinite' : 'none',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          if (!isActive) e.currentTarget.style.borderColor = 'var(--border-strong)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          if (!isActive) e.currentTarget.style.borderColor = isAttention ? '#eab30833' : 'var(--border-default)'
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
              color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'Consolas, monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              maxWidth: '100px',
            },
          }, agent.branch),
        ),
        agent.lastActivity
          ? React.createElement('span', {
              style: { color: 'var(--text-disabled)', fontSize: '10px' },
            }, getTimeSince(agent.lastActivity))
          : null
      )
    }),

    // New agent button
    React.createElement('button', {
      onClick: () => useStore.getState().openCreateAgent(),
      style: {
        padding: '6px 12px', background: 'transparent',
        border: '1px dashed #222', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
        fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 150ms',
        flexShrink: 0, height: '44px',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.color = 'var(--accent)'
      },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = '#222'
        e.currentTarget.style.color = 'var(--text-tertiary)'
      },
    }, '+ agent')
  )
}

export default AgentBar
