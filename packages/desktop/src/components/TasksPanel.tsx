import * as React from 'react'
import { useState } from 'react'
import { useStore } from '../store/index'
import { RunnioTask, TaskStatus } from '../types'
import { CircleDot, Circle, CheckCircle, Eye, Clock, Plus, ChevronDown, ChevronRight } from 'lucide-react'

const STATUS_CONFIG: Record<TaskStatus, { Icon: typeof CircleDot; color: string; label: string }> = {
  'todo':              { Icon: Circle,     color: 'var(--text-disabled)', label: 'todo' },
  'in-progress':       { Icon: CircleDot,  color: 'var(--working)',       label: 'in-progress' },
  'ready-for-review':  { Icon: Eye,        color: 'var(--waiting)',       label: 'review' },
  'in-review':         { Icon: Clock,      color: '#a78bfa',             label: 'in-review' },
  'done':              { Icon: CheckCircle, color: 'var(--working)',      label: 'done' },
}

const STATUS_ORDER: Record<TaskStatus, number> = {
  'in-progress': 0, 'ready-for-review': 1, 'in-review': 2, 'todo': 3, 'done': 4,
}

const TasksPanel: React.FC = () => {
  const projects = useStore(s => s.projects)
  const tasks = useStore(s => s.tasks)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(projects.map(p => p.id)))
  const [showDone, setShowDone] = useState<Set<string>>(new Set())

  const toggleProject = (pid: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
  }

  const toggleShowDone = (pid: string) => {
    setShowDone(prev => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
  }

  const handleTaskClick = (task: RunnioTask) => {
    if (task.agentId) {
      useStore.getState().setActiveAgent(task.agentId)
    }
  }

  const handleNewTask = () => {
    // Navigate to kanban view where tasks can be managed
    useStore.getState().navigateTo('kanban')
  }

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' },
  },
    // Header
    React.createElement('div', {
      style: { padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    },
      React.createElement('button', {
        onClick: () => useStore.getState().navigateTo('kanban'),
        style: {
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const,
          letterSpacing: '0.08em', fontWeight: 600, transition: 'color 100ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--accent)' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-tertiary)' },
        title: 'Open Kanban board',
      }, 'Tasks'),
      React.createElement('span', {
        style: { fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' },
      }, `${tasks.filter(t => !t.archived).length}`),
    ),

    // Cascading list by project
    React.createElement('div', {
      style: { flex: 1, overflowY: 'auto' as const, padding: '0 8px' },
    },
      ...projects.map(project => {
        const projectTasks = tasks
          .filter(t => t.projectId === project.id && !t.archived)
          .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
        const activeTasks = projectTasks.filter(t => t.status !== 'done')
        const doneTasks = projectTasks.filter(t => t.status === 'done')
        const isExpanded = expandedProjects.has(project.id)
        const isDoneShown = showDone.has(project.id)

        if (projectTasks.length === 0) return null

        return React.createElement('div', { key: project.id, style: { marginBottom: '4px' } },
          // Project header
          React.createElement('button', {
            onClick: () => toggleProject(project.id),
            style: {
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
              padding: '4px 8px', background: 'transparent', border: 'none',
              cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 100ms',
            },
            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
            onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' },
          },
            React.createElement(isExpanded ? ChevronDown : ChevronRight, { size: 11, color: 'var(--text-disabled)' }),
            React.createElement('span', {
              style: { fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600, flex: 1, textAlign: 'left' as const },
            }, project.name),
            React.createElement('span', {
              style: { fontSize: '10px', color: 'var(--text-disabled)' },
            }, `${activeTasks.length}`),
          ),

          // Tasks
          isExpanded
            ? React.createElement('div', { style: { paddingLeft: '4px' } },
                ...activeTasks.map(task => {
                  const cfg = STATUS_CONFIG[task.status]
                  return React.createElement('button', {
                    key: task.id,
                    onClick: () => handleTaskClick(task),
                    style: {
                      display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                      padding: '4px 8px', background: 'transparent', border: 'none',
                      cursor: task.agentId ? 'pointer' : 'default', borderRadius: 'var(--radius-sm)',
                      transition: 'background 100ms', textAlign: 'left' as const,
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' },
                  },
                    React.createElement(cfg.Icon, { size: 11, color: cfg.color }),
                    React.createElement('span', {
                      style: { fontSize: '11px', color: 'var(--text-disabled)', width: '65px', flexShrink: 0 },
                    }, cfg.label),
                    React.createElement('span', {
                      style: {
                        flex: 1, fontSize: '12px', color: 'var(--text-primary)',
                        fontFamily: 'Consolas, monospace', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                      },
                    }, task.title),
                  )
                }),
                // Show done link
                doneTasks.length > 0
                  ? React.createElement('button', {
                      onClick: () => toggleShowDone(project.id),
                      style: {
                        display: 'block', width: '100%', padding: '3px 8px', background: 'none',
                        border: 'none', cursor: 'pointer', fontSize: '10px', color: 'var(--text-disabled)',
                        textAlign: 'left' as const,
                      },
                    }, isDoneShown ? 'Hide completed' : `Show ${doneTasks.length} completed`)
                  : null,
                // Done tasks (if shown)
                isDoneShown
                  ? doneTasks.map(task =>
                      React.createElement('div', {
                        key: task.id,
                        style: {
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '3px 8px', opacity: 0.5,
                        },
                      },
                        React.createElement(CheckCircle, { size: 11, color: 'var(--working)' }),
                        React.createElement('span', {
                          style: {
                            flex: 1, fontSize: '12px', color: 'var(--text-disabled)',
                            fontFamily: 'Consolas, monospace', textDecoration: 'line-through',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                          },
                        }, task.title),
                      )
                    )
                  : null,
              )
            : null,
        )
      }),
    ),

    // New task button
    React.createElement('div', { style: { padding: '8px' } },
      React.createElement('button', {
        onClick: handleNewTask,
        style: {
          width: '100%', padding: '6px', backgroundColor: 'transparent',
          border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)',
          fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 150ms',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.borderColor = 'var(--border-default)'
          e.currentTarget.style.color = 'var(--text-tertiary)'
        },
      }, React.createElement(Plus, { size: 12 }), 'New task'),
    ),
  )
}

export default TasksPanel
