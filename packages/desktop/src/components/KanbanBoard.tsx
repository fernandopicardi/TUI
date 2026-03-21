// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useMemo } from 'react'
import { useStore } from '../store/index'
import type { RunnioTask, TaskStatus } from '../types'

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To-do' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'ready-for-review', label: 'Ready for review' },
  { key: 'in-review', label: 'In review' },
  { key: 'done', label: 'Done' },
]

const STATUS_ICONS: Record<TaskStatus, string> = {
  'todo': '\u25CB',
  'in-progress': '\u25CF',
  'ready-for-review': '\u2713',
  'in-review': '\u21BB',
  'done': '\u2714',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  'todo': 'var(--text-tertiary)',
  'in-progress': 'var(--accent)',
  'ready-for-review': '#f59e0b',
  'in-review': '#8b5cf6',
  'done': '#22c55e',
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

interface Props {
  onNewTask?: (status?: TaskStatus) => void
  onEditTask?: (task: RunnioTask) => void
}

const KanbanBoard: React.FC<Props> = ({ onNewTask, onEditTask }) => {
  const tasks = useStore(s => s.tasks)
  const projects = useStore(s => s.projects)
  const [filterProject, setFilterProject] = useState<string>('all')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const filteredTasks = useMemo(() => {
    if (filterProject === 'all') return tasks
    return tasks.filter(t => t.projectId === filterProject)
  }, [tasks, filterProject])

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, RunnioTask[]> = {
      'todo': [], 'in-progress': [], 'ready-for-review': [], 'in-review': [], 'done': [],
    }
    for (const task of filteredTasks) {
      if (map[task.status]) map[task.status].push(task)
    }
    return map
  }, [filteredTasks])

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown'
  }

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column' as const, height: '100%', gap: '12px' },
  },
    // Filter bar
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px',
      },
    },
      React.createElement('select', {
        value: filterProject,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterProject(e.target.value),
        style: {
          backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)',
          border: '1px solid var(--border-default)', borderRadius: '6px',
          padding: '6px 10px', fontSize: 'var(--text-sm)', cursor: 'pointer',
          outline: 'none',
        },
      },
        React.createElement('option', { value: 'all' }, 'All projects'),
        ...projects.map(p =>
          React.createElement('option', { key: p.id, value: p.id }, p.name)
        ),
      ),
      React.createElement('button', {
        onClick: () => onNewTask?.(),
        style: {
          marginLeft: 'auto', padding: '6px 14px',
          backgroundColor: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '6px', fontSize: 'var(--text-sm)',
          cursor: 'pointer', fontWeight: 500,
        },
      }, '+ New task'),
    ),

    // Kanban columns
    React.createElement('div', {
      style: {
        display: 'flex', gap: '12px', flex: 1, overflow: 'auto',
        padding: '0 4px 4px',
      },
    },
      ...COLUMNS.map(col => {
        const colTasks = tasksByStatus[col.key]
        return React.createElement('div', {
          key: col.key,
          style: {
            flex: 1, minWidth: '200px', display: 'flex',
            flexDirection: 'column' as const, gap: '8px',
          },
        },
          // Column header
          React.createElement('div', {
            style: {
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px',
              backgroundColor: 'var(--bg-elevated)', borderRadius: '6px',
              borderBottom: `2px solid ${STATUS_COLORS[col.key]}`,
            },
          },
            React.createElement('div', {
              style: { display: 'flex', alignItems: 'center', gap: '8px' },
            },
              React.createElement('span', {
                style: { fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' },
              }, col.label),
              React.createElement('span', {
                style: {
                  fontSize: '11px', color: 'var(--text-disabled)',
                  backgroundColor: 'var(--bg-app)', borderRadius: '10px',
                  padding: '1px 7px', minWidth: '18px', textAlign: 'center' as const,
                },
              }, String(colTasks.length)),
            ),
            col.key === 'todo'
              ? React.createElement('button', {
                  onClick: () => onNewTask?.(col.key),
                  style: {
                    background: 'none', border: 'none', color: 'var(--text-tertiary)',
                    cursor: 'pointer', fontSize: '16px', padding: '0 2px',
                    lineHeight: 1,
                  },
                  title: 'Add task',
                }, '+')
              : null,
          ),

          // Task cards
          React.createElement('div', {
            style: {
              flex: 1, display: 'flex', flexDirection: 'column' as const,
              gap: '6px', overflow: 'auto',
            },
          },
            ...colTasks.map(task =>
              React.createElement('div', {
                key: task.id,
                onClick: () => onEditTask?.(task),
                onMouseEnter: () => setHoveredCard(task.id),
                onMouseLeave: () => setHoveredCard(null),
                style: {
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px', padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'border-color 100ms, box-shadow 100ms',
                  borderColor: hoveredCard === task.id ? 'var(--accent)' : 'var(--border-default)',
                  boxShadow: hoveredCard === task.id ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  position: 'relative' as const,
                },
              },
                // Status icon + title
                React.createElement('div', {
                  style: { display: 'flex', alignItems: 'flex-start', gap: '8px' },
                },
                  React.createElement('span', {
                    style: { color: STATUS_COLORS[task.status], fontSize: '12px', marginTop: '2px', flexShrink: 0 },
                  }, STATUS_ICONS[task.status]),
                  React.createElement('span', {
                    style: {
                      fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const, flex: 1,
                    },
                  }, task.title),
                ),
                // Project name
                React.createElement('div', {
                  style: { fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', paddingLeft: '20px' },
                }, getProjectName(task.projectId)),
                // Time
                React.createElement('div', {
                  style: { fontSize: '10px', color: 'var(--text-disabled)', marginTop: '2px', paddingLeft: '20px' },
                }, timeAgo(task.updatedAt)),
                // Auto indicator
                task.isAutomatic
                  ? React.createElement('span', {
                      style: {
                        position: 'absolute' as const, top: '6px', right: '8px',
                        fontSize: '9px', color: 'var(--accent)', opacity: 0.6,
                      },
                      title: 'Auto-generated from agent',
                    }, '\u25C6')
                  : null,
                // Hover action
                hoveredCard === task.id
                  ? React.createElement('div', {
                      style: {
                        marginTop: '6px', paddingLeft: '20px',
                        fontSize: '11px', color: 'var(--accent)',
                      },
                    }, task.agentId ? 'Open agent \u2192' : 'Start agent')
                  : null,
              )
            ),
          ),
        )
      }),
    ),
  )
}

export default KanbanBoard
