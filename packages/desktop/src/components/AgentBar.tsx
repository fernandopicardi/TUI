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
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h`
  }

  if (allAgents.length === 0) {
    return React.createElement('div', {
      style: {
        height: '48px', display: 'flex', alignItems: 'center',
        padding: '0 16px', borderBottom: '1px solid #1a1a1a',
        backgroundColor: '#080808', flexShrink: 0,
      },
    },
      React.createElement('span', { style: { color: '#444', fontSize: '12px' } },
        'No active agents'),
      React.createElement('button', {
        onClick: () => useStore.getState().openCreateAgent(),
        style: {
          marginLeft: '12px', padding: '3px 10px', background: 'transparent',
          border: '1px dashed #333', borderRadius: '4px', color: '#555',
          fontSize: '11px', cursor: 'pointer', transition: 'all 0.15s',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          (e.currentTarget).style.borderColor = '#5b6af0';
          (e.currentTarget).style.color = '#5b6af0'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          (e.currentTarget).style.borderColor = '#333';
          (e.currentTarget).style.color = '#555'
        },
      }, '+ new agent')
    )
  }

  return React.createElement('div', {
    style: {
      minHeight: '64px', display: 'flex', alignItems: 'center',
      padding: '8px 16px', gap: '8px', borderBottom: '1px solid #1a1a1a',
      backgroundColor: '#080808', flexShrink: 0, overflowX: 'auto' as const,
    },
  },
    // Status summary
    React.createElement('div', {
      style: {
        display: 'flex', flexDirection: 'column' as const, gap: '2px',
        minWidth: '80px', flexShrink: 0,
      },
    },
      React.createElement('span', { style: { color: '#888', fontSize: '11px' } },
        `${working} running`),
      waiting > 0
        ? React.createElement('span', { style: { color: '#eab308', fontSize: '11px' } },
            `${waiting} waiting`)
        : null
    ),

    // Agent cards
    ...allAgents.map(agent => {
      const isActive = agent.id === activeAgentId
      const isAttention = agent.status === 'waiting' && agent.lastActivity
        && (Date.now() - agent.lastActivity) > 120000

      return React.createElement('button', {
        key: agent.id,
        onClick: () => useStore.getState().setActiveAgent(agent.id),
        style: {
          display: 'flex', flexDirection: 'column' as const, gap: '2px',
          padding: '6px 12px', minWidth: '140px',
          background: isActive ? '#161622' : isAttention ? 'rgba(234,179,8,0.05)' : 'transparent',
          border: '1px solid ' + (isActive ? '#5b6af044' : isAttention ? '#eab30833' : '#1f1f1f'),
          borderBottom: isActive ? '2px solid #5b6af0' : '2px solid transparent',
          borderRadius: '6px', cursor: 'pointer', textAlign: 'left' as const,
          transition: 'all 0.15s', flexShrink: 0,
          animation: isAttention ? 'pulse 2s infinite' : 'none',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          if (!isActive) (e.currentTarget).style.background = '#111'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          if (!isActive) (e.currentTarget).style.background = isAttention ? 'rgba(234,179,8,0.05)' : 'transparent'
        },
      },
        React.createElement('span', {
          style: { color: '#666', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
        }, getProjectName(agent.projectId)),
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '6px' },
        },
          React.createElement(AgentStatusBadge, { status: agent.status }),
          React.createElement('span', {
            style: {
              color: '#ededed', fontSize: '12px', fontFamily: 'Consolas, monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              maxWidth: '100px',
            },
          }, agent.branch),
        ),
        agent.lastActivity
          ? React.createElement('span', {
              style: { color: '#444', fontSize: '10px' },
            }, getTimeSince(agent.lastActivity))
          : null
      )
    }),

    // New agent button
    React.createElement('button', {
      onClick: () => useStore.getState().openCreateAgent(),
      style: {
        padding: '6px 12px', background: 'transparent',
        border: '1px dashed #222', borderRadius: '6px', color: '#555',
        fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
        flexShrink: 0, height: '44px',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
        (e.currentTarget).style.borderColor = '#5b6af0';
        (e.currentTarget).style.color = '#5b6af0'
      },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
        (e.currentTarget).style.borderColor = '#222';
        (e.currentTarget).style.color = '#555'
      },
    }, '+ agent')
  )
}

export default AgentBar
