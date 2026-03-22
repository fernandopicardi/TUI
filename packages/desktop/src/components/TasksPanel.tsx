import * as React from 'react'
import { useState, useEffect } from 'react'
import { useStore } from '../store/index'
import { CircleDot, Circle, Check, ArrowRight } from 'lucide-react'

type FilterMode = 'all' | 'by-project' | 'by-agent'
type TaskStatus = 'working' | 'waiting' | 'backlog' | 'done'

interface TaskItem {
  id: string
  title: string
  status: TaskStatus
  projectName: string
  projectId: string
  agentBranch?: string
  agentId?: string
  url?: string
  source: 'github'
}

const STATUS_ORDER: Record<TaskStatus, number> = { working: 0, waiting: 1, backlog: 2, done: 3 }

const STATUS_ICON_MAP: Record<TaskStatus, { Icon: typeof CircleDot; color: string }> = {
  working: { Icon: CircleDot, color: 'var(--working)' },
  waiting: { Icon: Circle, color: 'var(--waiting)' },
  backlog: { Icon: Circle, color: 'var(--text-disabled)' },
  done: { Icon: Check, color: 'var(--working)' },
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  working: 'In Progress',
  waiting: 'Waiting',
  backlog: 'Backlog',
  done: 'Done',
}

const TasksPanel: React.FC = () => {
  const projects = useStore(s => s.projects)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)

  // Fetch issues from all projects
  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      if (projects.length === 0) { setTasks([]); return }
      setLoading(true)

      const allTasks: TaskItem[] = []
      const allAgents = projects.flatMap(p => p.agents.map(a => ({ ...a, projectName: p.name })))

      for (const project of projects) {
        try {
          const result = await window.runnio?.github?.listIssues(project.rootPath)
          if (!result?.success || cancelled) continue

          for (const issue of result.issues) {
            // Match issue to an agent by exact branch name
            // Branch must exactly equal the issue number slug (e.g. "issue-42" or "42-fix-bug")
            const issueNum = String(issue.id)
            const matchedAgent = allAgents.find(a =>
              a.projectId === project.id &&
              a.branch === issueNum
            ) ?? allAgents.find(a =>
              a.projectId === project.id && (
                a.branch === `issue-${issueNum}` ||
                a.branch.startsWith(`${issueNum}-`) ||
                a.branch.endsWith(`-${issueNum}`)
              )
            )

            let status: TaskStatus = 'backlog'
            if (issue.state === 'closed') {
              status = 'done'
            } else if (matchedAgent) {
              status = matchedAgent.status === 'working' ? 'working'
                : matchedAgent.status === 'waiting' ? 'waiting'
                : matchedAgent.status === 'done' ? 'done'
                : 'backlog'
            }

            allTasks.push({
              id: `gh-${project.id}-${issue.id}`,
              title: issue.title,
              status,
              projectName: project.name,
              projectId: project.id,
              agentBranch: matchedAgent?.branch,
              agentId: matchedAgent?.id,
              url: issue.url,
              source: 'github',
            })
          }
        } catch { /* silent */ }
      }

      if (!cancelled) {
        setTasks(allTasks)
        setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [projects])

  const sortedTasks = [...tasks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  const handleOpenAgent = (agentId: string) => {
    useStore.getState().setActiveAgent(agentId)
  }

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px', fontSize: '11px', border: 'none',
    borderRadius: '10px', cursor: 'pointer', transition: 'all 100ms',
    background: active ? 'var(--accent)' : 'var(--bg-hover)',
    color: active ? '#fff' : 'var(--text-secondary)',
  })

  const renderTask = (task: TaskItem) => {
    const icon = STATUS_ICON_MAP[task.status]
    const isHovered = hoveredTask === task.id

    return React.createElement('div', {
      key: task.id,
      style: {
        display: 'flex', flexDirection: 'column' as const, gap: '3px',
        padding: '8px 12px', borderRadius: 'var(--radius-md)',
        background: isHovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 100ms', cursor: task.agentId ? 'pointer' : 'default',
      },
      onMouseEnter: () => setHoveredTask(task.id),
      onMouseLeave: () => setHoveredTask(null),
      onClick: () => { if (task.agentId) handleOpenAgent(task.agentId) },
      title: task.title,
    },
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' },
      },
        React.createElement('span', {
          style: { color: icon.color, flexShrink: 0, width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        }, React.createElement(icon.Icon, { size: 12 })),
        React.createElement('span', {
          style: {
            flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          },
        }, task.title),
        isHovered && task.agentId
          ? React.createElement('span', {
              style: { fontSize: '10px', color: 'var(--accent)', flexShrink: 0 },
            }, 'Open agent ', React.createElement(ArrowRight, { size: 10 }))
          : null,
      ),
      (task.agentBranch || task.projectName)
        ? React.createElement('div', {
            style: {
              display: 'flex', gap: '6px', paddingLeft: '22px',
              fontSize: '10px', color: 'var(--text-tertiary)',
            },
          },
            task.agentBranch
              ? React.createElement('span', {
                  style: { fontFamily: 'Consolas, monospace' },
                }, task.agentBranch)
              : null,
            task.agentBranch && task.projectName
              ? React.createElement('span', null, '\u00B7')
              : null,
            React.createElement('span', null, task.projectName),
          )
        : null,
    )
  }

  const renderGrouped = (groupKey: 'projectName' | 'agentBranch') => {
    const groups = new Map<string, TaskItem[]>()
    for (const task of sortedTasks) {
      const key = groupKey === 'agentBranch'
        ? (task.agentBranch || 'Unassigned')
        : task.projectName
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(task)
    }

    const entries = Array.from(groups.entries())
    if (groupKey === 'agentBranch') {
      entries.sort((a, b) => {
        if (a[0] === 'Unassigned') return 1
        if (b[0] === 'Unassigned') return -1
        return a[0].localeCompare(b[0])
      })
    }

    return entries.map(([groupName, groupTasks]) =>
      React.createElement('div', { key: groupName },
        React.createElement('div', {
          style: {
            fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const,
            letterSpacing: '0.08em', padding: '12px 12px 4px', fontWeight: 600,
          },
        }, groupName),
        ...groupTasks.map(renderTask),
      )
    )
  }

  const renderByStatus = () => {
    const statusGroups: TaskStatus[] = ['working', 'waiting', 'backlog', 'done']
    return statusGroups.map(status => {
      const statusTasks = sortedTasks.filter(t => t.status === status)
      if (statusTasks.length === 0) return null

      return React.createElement('div', { key: status },
        React.createElement('div', {
          style: {
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 12px 6px',
          },
        },
          React.createElement('span', {
            style: { fontSize: '11px', fontWeight: 600, color: STATUS_ICON_MAP[status].color },
          }, STATUS_LABELS[status]),
          React.createElement('div', {
            style: { flex: 1, height: '1px', background: 'var(--border-subtle)' },
          }),
          React.createElement('span', {
            style: { fontSize: '10px', color: 'var(--text-disabled)' },
          }, statusTasks.length),
        ),
        ...statusTasks.map(renderTask),
      )
    })
  }

  return React.createElement('div', {
    style: {
      display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden',
    },
  },
    // Filter pills
    React.createElement('div', {
      style: { display: 'flex', gap: '4px', padding: '8px 12px' },
    },
      React.createElement('button', {
        onClick: () => setFilter('all'),
        style: pillStyle(filter === 'all'),
      }, 'All'),
      React.createElement('button', {
        onClick: () => setFilter('by-project'),
        style: pillStyle(filter === 'by-project'),
      }, 'By project'),
      React.createElement('button', {
        onClick: () => setFilter('by-agent'),
        style: pillStyle(filter === 'by-agent'),
      }, 'By agent'),
    ),

    // Tasks list
    React.createElement('div', {
      style: { flex: 1, overflowY: 'auto' as const, padding: '0 4px' },
    },
      loading
        ? React.createElement('div', {
            style: { padding: '24px', textAlign: 'center' as const, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' },
          }, 'Loading issues...')
        : tasks.length === 0
          ? React.createElement('div', {
              style: { padding: '24px', textAlign: 'center' as const, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', lineHeight: '1.6' },
            },
              React.createElement('div', { style: { marginBottom: '8px' } }, 'No tasks found'),
              React.createElement('div', { style: { fontSize: '10px', color: 'var(--text-disabled)' } },
                'Tasks are pulled from GitHub Issues for projects with a remote.'),
            )
          : filter === 'all'
            ? renderByStatus()
            : filter === 'by-project'
              ? renderGrouped('projectName')
              : renderGrouped('agentBranch'),
    ),
  )
}

export default TasksPanel
