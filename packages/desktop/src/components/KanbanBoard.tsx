import * as React from 'react'
import { useState, useMemo } from 'react'
import { useStore } from '../store/index'
import { RunnioTask, TaskStatus } from '../types'
import { CircleDot, Circle, CheckCircle, Eye, Clock, Plus, Trash2, X, ExternalLink, Sparkles, Archive } from 'lucide-react'

const COLUMNS: { id: TaskStatus; label: string; color: string; Icon: typeof Circle }[] = [
  { id: 'todo',              label: 'To-do',             color: 'var(--text-disabled)', Icon: Circle },
  { id: 'in-progress',       label: 'In progress',       color: 'var(--working)',       Icon: CircleDot },
  { id: 'ready-for-review',  label: 'Ready for review',  color: 'var(--waiting)',        Icon: Eye },
  { id: 'in-review',         label: 'In review',         color: '#a78bfa',              Icon: Clock },
  { id: 'done',              label: 'Done',              color: 'var(--working)',        Icon: CheckCircle },
]

const formatTime = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Task detail modal ──
const TaskDetailModal: React.FC<{ task: RunnioTask; onClose: () => void }> = ({ task, onClose }) => {
  const [title, setTitle] = useState(task.title)
  const [status, setStatus] = useState(task.status)
  const projects = useStore(s => s.projects)
  const project = projects.find(p => p.id === task.projectId)

  const handleSave = () => {
    const store = useStore.getState()
    if (title !== task.title) store.updateTask(task.id, { title })
    if (status !== task.status) store.moveTask(task.id, status)
    onClose()
  }

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
    },
    onClick: (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose() },
  },
    React.createElement('div', {
      style: {
        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: '12px', width: '480px', maxHeight: '80vh', overflow: 'auto' as const,
        animation: 'fadeIn 0.15s ease-out',
      },
    },
      // Header
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-default)' },
      },
        React.createElement('span', { style: { fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' } }, 'Task details'),
        React.createElement('button', {
          onClick: onClose,
          style: { background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', display: 'flex' },
        }, React.createElement(X, { size: 16 })),
      ),
      // Body
      React.createElement('div', { style: { padding: '20px' } },
        // Title
        React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: { fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' } }, 'Title'),
          React.createElement('input', {
            value: title,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value),
            style: {
              width: '100%', padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border-default)',
              borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              fontFamily: 'Consolas, monospace', boxSizing: 'border-box' as const,
            },
          }),
        ),
        // Status
        React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: { fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' } }, 'Status'),
          React.createElement('select', {
            value: status,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as TaskStatus),
            style: {
              width: '100%', padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border-default)',
              borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
              appearance: 'auto' as const,
            },
          },
            ...COLUMNS.map(c => React.createElement('option', { key: c.id, value: c.id }, c.label)),
          ),
        ),
        // Project
        React.createElement('div', { style: { marginBottom: '16px', display: 'flex', gap: '16px' } },
          React.createElement('div', null,
            React.createElement('label', { style: { fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' } }, 'Project'),
            React.createElement('span', { style: { fontSize: '13px', color: 'var(--text-primary)' } }, project?.name || 'Unknown'),
          ),
          task.agentId
            ? React.createElement('div', null,
                React.createElement('label', { style: { fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' } }, 'Agent'),
                React.createElement('button', {
                  onClick: () => { useStore.getState().setActiveAgent(task.agentId!); onClose() },
                  style: {
                    padding: '4px 10px', background: 'var(--bg-app)', border: '1px solid var(--border-default)',
                    borderRadius: '4px', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px',
                    fontFamily: 'Consolas, monospace', display: 'flex', alignItems: 'center', gap: '4px',
                  },
                }, React.createElement(Sparkles, { size: 10 }), 'Open workspace'),
              )
            : null,
        ),
        // External link
        task.externalUrl
          ? React.createElement('div', { style: { marginBottom: '16px' } },
              React.createElement('label', { style: { fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' } }, 'External link'),
              React.createElement('a', {
                href: '#',
                onClick: (e: React.MouseEvent) => {
                  e.preventDefault()
                  navigator.clipboard.writeText(task.externalUrl!).catch(() => {})
                  useStore.getState().showToast('URL copied', 'info')
                },
                style: { fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' },
              }, React.createElement(ExternalLink, { size: 10 }), task.externalUrl),
            )
          : null,
        // Initial prompt
        task.initialPrompt
          ? React.createElement('div', { style: { marginBottom: '16px' } },
              React.createElement('label', { style: { fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' } }, 'Initial prompt'),
              React.createElement('div', {
                style: {
                  padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border-default)',
                  borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)',
                  fontFamily: 'Consolas, monospace', whiteSpace: 'pre-wrap' as const, maxHeight: '100px', overflow: 'auto' as const,
                },
              }, task.initialPrompt),
            )
          : null,
        // Activity log
        task.activityLog.length > 0
          ? React.createElement('div', { style: { marginBottom: '16px' } },
              React.createElement('label', { style: { fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' } }, 'Activity'),
              React.createElement('div', {
                style: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
              },
                ...task.activityLog.slice(-10).reverse().map((entry, i) =>
                  React.createElement('div', {
                    key: i,
                    style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px' },
                  },
                    React.createElement('span', { style: { color: 'var(--text-secondary)' } }, entry.action),
                    React.createElement('span', { style: { color: 'var(--text-disabled)' } }, formatTime(entry.timestamp)),
                  )
                ),
              ),
            )
          : null,
      ),
      // Footer
      React.createElement('div', {
        style: { padding: '12px 20px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
      },
        React.createElement('button', {
          onClick: () => { useStore.getState().removeTask(task.id); onClose() },
          style: {
            padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: '6px', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '12px',
          },
        }, 'Delete'),
        React.createElement('button', {
          onClick: handleSave,
          style: {
            padding: '6px 16px', background: 'var(--accent)', border: 'none',
            borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px',
          },
        }, 'Save'),
      ),
    ),
  )
}

// ── New task inline creator ──
const InlineTaskCreator: React.FC<{ column: TaskStatus; onDone: () => void }> = ({ column, onDone }) => {
  const [title, setTitle] = useState('')
  const projects = useStore(s => s.projects)
  const [projectId, setProjectId] = useState(projects[0]?.id || '')

  const handleCreate = () => {
    if (!title.trim() || !projectId) return
    const now = Date.now()
    useStore.getState().addTask({
      id: `task-${now}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      status: column,
      source: 'runnio',
      projectId,
      createdAt: now,
      updatedAt: now,
      isAutomatic: false,
      activityLog: [{ action: `Created in ${column}`, timestamp: now }],
    })
    onDone()
  }

  return React.createElement('div', {
    style: {
      padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
      borderRadius: '8px', display: 'flex', flexDirection: 'column' as const, gap: '6px',
    },
  },
    React.createElement('input', {
      value: title,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value),
      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onDone() },
      placeholder: 'Task title...',
      autoFocus: true,
      style: {
        padding: '6px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-default)',
        borderRadius: '4px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
        fontFamily: 'inherit',
      },
    }),
    projects.length > 1
      ? React.createElement('select', {
          value: projectId,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setProjectId(e.target.value),
          style: {
            padding: '4px 6px', background: 'var(--bg-app)', border: '1px solid var(--border-default)',
            borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer',
          },
        },
          ...projects.map(p => React.createElement('option', { key: p.id, value: p.id }, p.name)),
        )
      : null,
    React.createElement('div', { style: { display: 'flex', gap: '4px', justifyContent: 'flex-end' } },
      React.createElement('button', {
        onClick: onDone,
        style: { padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: '4px', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '11px' },
      }, 'Cancel'),
      React.createElement('button', {
        onClick: handleCreate,
        disabled: !title.trim(),
        style: { padding: '4px 10px', background: 'var(--accent)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '11px', opacity: title.trim() ? 1 : 0.5 },
      }, 'Add'),
    ),
  )
}

// ── Main Kanban Board ──
const KanbanBoard: React.FC = () => {
  const tasks = useStore(s => s.tasks)
  const projects = useStore(s => s.projects)
  const [selectedTask, setSelectedTask] = useState<RunnioTask | null>(null)
  const [creatingIn, setCreatingIn] = useState<TaskStatus | null>(null)
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [hideActive, setHideActive] = useState(false)

  const visibleTasks = useMemo(() => {
    let result = tasks.filter(t => !t.archived)
    if (projectFilter !== 'all') {
      result = result.filter(t => t.projectId === projectFilter)
    }
    return result
  }, [tasks, projectFilter])

  const getProjectName = (pid: string) => projects.find(p => p.id === pid)?.name || 'Unknown'

  const columnsToShow = hideActive ? COLUMNS.filter(c => c.id !== 'done') : COLUMNS

  return React.createElement('div', {
    style: { height: '100%', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
  },
    // Toolbar
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px',
        borderBottom: '1px solid var(--border-default)', flexShrink: 0,
      },
    },
      React.createElement('h2', {
        style: { margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' },
      }, 'Tasks'),
      React.createElement('span', {
        style: { fontSize: '12px', color: 'var(--text-disabled)' },
      }, `${visibleTasks.filter(t => t.status !== 'done').length} active`),
      React.createElement('div', { style: { flex: 1 } }),
      // Project filter
      React.createElement('select', {
        value: projectFilter,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setProjectFilter(e.target.value),
        style: {
          padding: '4px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
        },
      },
        React.createElement('option', { value: 'all' }, 'All projects'),
        ...projects.map(p => React.createElement('option', { key: p.id, value: p.id }, p.name)),
      ),
      // Hide done toggle
      React.createElement('label', {
        style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-tertiary)', cursor: 'pointer' },
      },
        React.createElement('input', {
          type: 'checkbox', checked: hideActive,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHideActive(e.target.checked),
          style: { accentColor: 'var(--accent)' },
        }),
        'Hide done',
      ),
    ),
    // Columns
    React.createElement('div', {
      style: {
        flex: 1, display: 'flex', gap: '12px', padding: '12px 16px',
        overflowX: 'auto' as const, overflowY: 'hidden',
      },
    },
      ...columnsToShow.map(col => {
        const columnTasks = visibleTasks
          .filter(t => t.status === col.id)
          .sort((a, b) => b.updatedAt - a.updatedAt)

        return React.createElement('div', {
          key: col.id,
          style: {
            flex: 1, minWidth: '200px', maxWidth: '280px',
            display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
            background: 'var(--bg-app)', borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
          },
        },
          // Column header
          React.createElement('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
            },
          },
            React.createElement(col.Icon, { size: 13, color: col.color }),
            React.createElement('span', {
              style: { fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 },
            }, col.label),
            React.createElement('span', {
              style: { fontSize: '11px', color: 'var(--text-disabled)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: '8px' },
            }, columnTasks.length),
            col.id === 'done' && columnTasks.length > 0
              ? React.createElement('button', {
                  onClick: () => useStore.getState().archiveDoneTasks(),
                  title: 'Archive all done tasks',
                  style: {
                    background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', padding: '2px',
                  },
                }, React.createElement(Archive, { size: 12 }))
              : null,
          ),
          // Cards
          React.createElement('div', {
            style: { flex: 1, overflowY: 'auto' as const, padding: '6px', display: 'flex', flexDirection: 'column' as const, gap: '6px' },
          },
            ...columnTasks.map(task =>
              React.createElement('button', {
                key: task.id,
                onClick: () => setSelectedTask(task),
                style: {
                  display: 'flex', flexDirection: 'column' as const, gap: '4px',
                  padding: '10px 12px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)', borderRadius: '8px',
                  cursor: 'pointer', transition: 'all 100ms', textAlign: 'left' as const,
                  width: '100%',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                  e.currentTarget.style.transform = 'translateY(0)'
                },
              },
                // Title
                React.createElement('span', {
                  style: {
                    fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  },
                }, task.title),
                // Meta row
                React.createElement('div', {
                  style: { display: 'flex', alignItems: 'center', gap: '6px' },
                },
                  React.createElement('span', {
                    style: { fontSize: '10px', color: 'var(--text-disabled)' },
                  }, getProjectName(task.projectId)),
                  task.isAutomatic
                    ? React.createElement(Sparkles, { size: 9, color: 'var(--text-disabled)' })
                    : null,
                  React.createElement('span', { style: { flex: 1 } }),
                  React.createElement('span', {
                    style: { fontSize: '10px', color: 'var(--text-disabled)' },
                  }, formatTime(task.updatedAt)),
                ),
              )
            ),
            // Inline creator
            creatingIn === col.id
              ? React.createElement(InlineTaskCreator, {
                  column: col.id,
                  onDone: () => setCreatingIn(null),
                })
              : null,
          ),
          // Add button
          creatingIn !== col.id
            ? React.createElement('button', {
                onClick: () => setCreatingIn(col.id),
                style: {
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  padding: '8px', background: 'transparent', border: 'none',
                  borderTop: '1px solid var(--border-subtle)', cursor: 'pointer',
                  color: 'var(--text-disabled)', fontSize: '11px', transition: 'color 100ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--accent)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
              }, React.createElement(Plus, { size: 12 }), 'Add task')
            : null,
        )
      }),
    ),

    // Task detail modal
    selectedTask
      ? React.createElement(TaskDetailModal, {
          task: selectedTask,
          onClose: () => setSelectedTask(null),
        })
      : null,
  )
}

export default KanbanBoard
