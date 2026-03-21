// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import { AgentSession, GitCommitData } from '../types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function getTimeSince(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface RecentCommit extends GitCommitData {
  projectName: string
  projectId: string
}

const Home: React.FC = () => {
  const projects = useStore(s => s.projects)
  const [githubUser, setGithubUser] = useState('')
  const [recentCommits, setRecentCommits] = useState<RecentCommit[]>([])

  // Get GitHub user name
  useEffect(() => {
    window.runnio.settings.readGlobal().then(data => {
      if (data.githubLogin) setGithubUser(data.githubLogin)
    })
  }, [])

  // Fetch recent commits across all projects
  useEffect(() => {
    const fetchCommits = async () => {
      const allCommits: RecentCommit[] = []
      for (const project of projects) {
        try {
          const result = await window.runnio.git.log(project.rootPath, { maxCount: 5 })
          if (result.commits) {
            result.commits.forEach(c => {
              allCommits.push({ ...c, projectName: project.name, projectId: project.id })
            })
          }
        } catch { /* ignore */ }
      }
      allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentCommits(allCommits.slice(0, 10))
    }
    if (projects.length > 0) fetchCommits()
  }, [projects])

  const activeAgents = useMemo(() => {
    const agents: (AgentSession & { projectName: string })[] = []
    projects.forEach(p => {
      p.agents.forEach(a => {
        if (a.status === 'working' || a.status === 'waiting') {
          agents.push({ ...a, projectName: p.name })
        }
      })
    })
    return agents
  }, [projects])

  const sectionHeaderStyle: React.CSSProperties = {
    color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 600,
    textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
  }

  const sectionLineStyle: React.CSSProperties = {
    flex: 1, height: '1px', background: 'var(--border-subtle)',
  }

  return React.createElement('div', {
    style: {
      height: '100%', overflow: 'auto' as const, padding: '32px 40px',
      animation: 'fadeIn 0.2s ease-out',
    },
  },
    // Greeting header
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    },
      React.createElement('div', null,
        React.createElement('h1', {
          style: { fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' },
        }, `${getGreeting()}${githubUser ? `, ${githubUser}` : ''}`),
        React.createElement('p', {
          style: { fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 },
        }, getDateString()),
      ),
      React.createElement('button', {
        onClick: () => useStore.getState().openAddProject(),
        style: {
          padding: '8px 16px', background: 'var(--accent)', border: 'none',
          borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 500,
          cursor: 'pointer', transition: 'opacity 150ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
      }, '+ Add project'),
    ),

    // Active agents section
    activeAgents.length > 0
      ? React.createElement('div', { style: { marginBottom: '28px' } },
          React.createElement('div', { style: sectionHeaderStyle },
            React.createElement('span', null, 'Active agents'),
            React.createElement('div', { style: sectionLineStyle }),
          ),
          React.createElement('div', {
            style: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
          },
            ...activeAgents.map(agent =>
              React.createElement('button', {
                key: agent.id,
                onClick: () => useStore.getState().setActiveAgent(agent.id),
                style: {
                  display: 'flex', flexDirection: 'column' as const, gap: '4px',
                  padding: '10px 14px', minWidth: '160px',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                  borderLeft: `3px solid ${agent.status === 'working' ? 'var(--working)' : 'var(--waiting)'}`,
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'all 150ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-surface)' },
              },
                React.createElement('div', {
                  style: { display: 'flex', alignItems: 'center', gap: '6px' },
                },
                  React.createElement('span', {
                    style: {
                      width: '7px', height: '7px', borderRadius: '50%',
                      backgroundColor: agent.status === 'working' ? 'var(--working)' : 'var(--waiting)',
                      animation: agent.status === 'working' ? 'pulse 2s infinite' : 'none',
                    },
                  }),
                  React.createElement('span', {
                    style: { color: 'var(--text-secondary)', fontSize: '12px' },
                  }, agent.status),
                ),
                React.createElement('span', {
                  style: { color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Consolas, monospace' },
                }, `${agent.projectName}/${agent.branch}`),
                React.createElement('span', {
                  style: { color: 'var(--text-tertiary)', fontSize: '11px' },
                }, agent.lastActivity ? getTimeSince(agent.lastActivity) : ''),
              )
            ),
          ),
        )
      : null,

    // Projects section
    React.createElement('div', { style: { marginBottom: '28px' } },
      React.createElement('div', { style: sectionHeaderStyle },
        React.createElement('span', null, 'Projects'),
        React.createElement('div', { style: sectionLineStyle }),
      ),
      projects.length > 0
        ? React.createElement('div', {
            style: {
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: '8px', overflow: 'hidden',
            },
          },
            ...projects.map((project, i) => {
              const agentCount = project.agents.length
              const workingCount = project.agents.filter(a => a.status === 'working').length
              const waitingCount = project.agents.filter(a => a.status === 'waiting').length
              const latestActivity = Math.max(...project.agents.map(a => a.lastActivity || 0), project.lastOpenedAt || 0)

              return React.createElement('button', {
                key: project.id,
                onClick: () => useStore.getState().setActiveProject(project.id),
                style: {
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', width: '100%',
                  background: 'transparent', border: 'none',
                  borderBottom: i < projects.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer', textAlign: 'left' as const, transition: 'background 100ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' },
              },
                // Project icon
                React.createElement('span', {
                  style: {
                    fontSize: '14px',
                    color: workingCount > 0 ? 'var(--working)' : 'var(--text-tertiary)',
                  },
                }, workingCount > 0 ? '\u25C6' : '\u25CB'),
                // Name + plugin
                React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                  React.createElement('div', {
                    style: { display: 'flex', alignItems: 'center', gap: '8px' },
                  },
                    React.createElement('span', {
                      style: { color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'Consolas, monospace', fontWeight: 500 },
                    }, project.name),
                    React.createElement('span', {
                      style: {
                        padding: '1px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        borderRadius: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'capitalize' as const,
                      },
                    }, project.plugin),
                  ),
                ),
                // Agent count
                React.createElement('span', {
                  style: { color: 'var(--text-secondary)', fontSize: '12px', minWidth: '70px' },
                }, `${agentCount} agent${agentCount !== 1 ? 's' : ''}`),
                // Status indicator
                React.createElement('span', {
                  style: { display: 'flex', alignItems: 'center', gap: '4px', minWidth: '80px', fontSize: '12px' },
                },
                  workingCount > 0
                    ? React.createElement(React.Fragment, null,
                        React.createElement('span', { style: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--working)', animation: 'pulse 2s infinite' } }),
                        React.createElement('span', { style: { color: 'var(--working)' } }, `${workingCount} working`),
                      )
                    : waitingCount > 0
                      ? React.createElement(React.Fragment, null,
                          React.createElement('span', { style: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--waiting)' } }),
                          React.createElement('span', { style: { color: 'var(--waiting)' } }, `${waitingCount} waiting`),
                        )
                      : React.createElement('span', { style: { color: 'var(--text-disabled)' } }, agentCount > 0 ? 'idle' : '\u2014'),
                ),
                // Last activity
                React.createElement('span', {
                  style: { color: 'var(--text-tertiary)', fontSize: '11px', minWidth: '50px', textAlign: 'right' as const },
                }, latestActivity > 0 ? getTimeSince(latestActivity) : ''),
                // Arrow
                React.createElement('span', {
                  style: { color: 'var(--text-disabled)', fontSize: '12px' },
                }, '\u2192'),
              )
            }),
          )
        : React.createElement('div', {
            style: { padding: '24px', textAlign: 'center' as const, color: 'var(--text-secondary)', fontSize: '14px' },
          }, 'No projects yet. Add a Git project to get started.'),
    ),

    // Recent activity section
    recentCommits.length > 0
      ? React.createElement('div', { style: { marginBottom: '28px' } },
          React.createElement('div', { style: sectionHeaderStyle },
            React.createElement('span', null, 'Recent activity'),
            React.createElement('div', { style: sectionLineStyle }),
          ),
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
          },
            ...recentCommits.map((commit, i) =>
              React.createElement('button', {
                key: `${commit.hash}-${i}`,
                onClick: () => {
                  const s = useStore.getState()
                  s.setActiveProject(commit.projectId)
                },
                style: {
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '8px 12px', background: 'transparent', border: 'none',
                  borderRadius: '6px', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'background 100ms', width: '100%',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' },
              },
                React.createElement('span', {
                  style: {
                    color: 'var(--text-primary)', fontSize: '13px', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  },
                }, commit.message.split('\n')[0]),
                React.createElement('span', {
                  style: { color: 'var(--text-tertiary)', fontSize: '12px', fontFamily: 'Consolas, monospace', flexShrink: 0 },
                }, commit.projectName),
                React.createElement('span', {
                  style: { color: 'var(--text-disabled)', fontSize: '11px', flexShrink: 0, minWidth: '40px', textAlign: 'right' as const },
                }, commit.date ? getTimeSince(new Date(commit.date).getTime()) : ''),
              )
            ),
          ),
        )
      : null,
  )
}

export default Home
