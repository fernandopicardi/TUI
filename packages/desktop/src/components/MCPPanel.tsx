import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { MCPServerEntry } from '../types'

interface Props {
  worktreePath: string
}

const MCPPanel: React.FC<Props> = ({ worktreePath }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [servers, setServers] = useState<MCPServerEntry[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [hoveredServer, setHoveredServer] = useState<string | null>(null)

  // Add form state
  const [newName, setNewName] = useState('')
  const [newCommand, setNewCommand] = useState('')
  const [newArgs, setNewArgs] = useState('')
  const [newScope, setNewScope] = useState<'global' | 'project'>('project')
  const [addError, setAddError] = useState<string | null>(null)

  const loadServers = useCallback(() => {
    if (!window.regent?.mcp) return
    window.regent.mcp.getConfig(worktreePath)
      .then(setServers)
      .catch(() => {})
  }, [worktreePath])

  useEffect(() => {
    if (isExpanded) loadServers()
  }, [isExpanded, loadServers])

  const handleRemove = async (name: string, scope: 'global' | 'project') => {
    if (!confirm(`Remove MCP server "${name}"?`)) return
    const result = await window.regent.mcp.removeServer(worktreePath, name, scope)
    if (result.success) loadServers()
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newCommand.trim()) return
    setAddError(null)
    const server = {
      name: newName.trim(),
      command: newCommand.trim(),
      args: newArgs.trim() ? newArgs.trim().split(/\s+/) : [],
    }
    const result = await window.regent.mcp.addServer(worktreePath, server, newScope)
    if (result.success) {
      setShowAddModal(false)
      setNewName('')
      setNewCommand('')
      setNewArgs('')
      loadServers()
    } else {
      setAddError(result.error || 'Failed to add server')
    }
  }

  const globalServers = servers.filter(s => s.scope === 'global')
  const projectServers = servers.filter(s => s.scope === 'project')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: '#0a0a0a', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--text-base)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'Consolas, monospace',
  }

  const renderServer = (s: MCPServerEntry) => (
    React.createElement('div', {
      key: `${s.scope}-${s.name}`,
      style: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 10px', borderRadius: 'var(--radius-sm)',
        transition: 'background 100ms',
        background: hoveredServer === s.name ? 'var(--bg-hover)' : 'transparent',
      },
      onMouseEnter: () => setHoveredServer(s.name),
      onMouseLeave: () => setHoveredServer(null),
    },
      React.createElement('span', { style: { color: 'var(--accent)', fontSize: '10px' } }, '\u25C9'),
      React.createElement('span', {
        style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'Consolas, monospace', flex: 1 },
      }, s.name),
      React.createElement('span', {
        style: {
          color: 'var(--text-disabled)', fontSize: '10px', maxWidth: '180px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
        },
        title: `${s.command} ${(s.args || []).join(' ')}`,
      }, s.command),
      hoveredServer === s.name
        ? React.createElement('button', {
            onClick: () => handleRemove(s.name, s.scope),
            style: {
              background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer',
              fontSize: 'var(--text-sm)', padding: '0 2px', transition: 'color 100ms',
            },
            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--error)' },
            onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
          }, '\u00D7')
        : null,
    )
  )

  return React.createElement('div', {
    style: {
      borderTop: '1px solid var(--border-default)',
      background: 'var(--bg-app)',
      flexShrink: 0,
    },
  },
    // Collapsible header
    React.createElement('button', {
      onClick: () => setIsExpanded(v => !v),
      style: {
        width: '100%', padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
      },
    },
      React.createElement('span', {
        style: { display: 'flex', alignItems: 'center', gap: '8px' },
      },
        React.createElement('span', { style: { color: 'var(--accent)' } }, '\u25C6'),
        `MCP Servers${servers.length > 0 ? ` (${servers.length})` : ''}`
      ),
      React.createElement('span', { style: { fontSize: '10px' } }, isExpanded ? '\u25BC' : '\u25B6')
    ),

    isExpanded
      ? React.createElement('div', {
          style: { padding: '0 16px 12px' },
        },
          servers.length === 0
            ? React.createElement('div', {
                style: { textAlign: 'center' as const, padding: '16px 0' },
              },
                React.createElement('div', {
                  style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-base)', marginBottom: '8px' },
                }, 'No MCP servers configured'),
                React.createElement('div', {
                  style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', marginBottom: '12px' },
                }, 'MCP servers extend Claude Code\'s capabilities.'),
                React.createElement('button', {
                  onClick: () => setShowAddModal(true),
                  style: {
                    padding: '6px 14px', background: 'var(--accent)', border: 'none',
                    borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-xs)',
                  },
                }, '+ Add your first MCP server'),
              )
            : React.createElement(React.Fragment, null,
                // Global servers
                globalServers.length > 0
                  ? React.createElement('div', { style: { marginBottom: '8px' } },
                      React.createElement('div', {
                        style: {
                          fontSize: '10px', color: 'var(--working)', textTransform: 'uppercase' as const,
                          letterSpacing: '0.08em', fontWeight: 600, marginBottom: '4px', padding: '0 10px',
                        },
                      }, 'Global (~/.claude)'),
                      ...globalServers.map(renderServer),
                    )
                  : null,
                // Project servers
                projectServers.length > 0
                  ? React.createElement('div', { style: { marginBottom: '8px' } },
                      React.createElement('div', {
                        style: {
                          fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase' as const,
                          letterSpacing: '0.08em', fontWeight: 600, marginBottom: '4px', padding: '0 10px',
                        },
                      }, 'This project (.claude/)'),
                      ...projectServers.map(renderServer),
                    )
                  : null,
                // Add button
                React.createElement('div', {
                  style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '0 10px' },
                },
                  React.createElement('button', {
                    onClick: () => setShowAddModal(true),
                    style: {
                      background: 'none', border: '1px dashed var(--text-disabled)', borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 'var(--text-xs)', padding: '4px 10px',
                      transition: 'all 100ms',
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--accent)'
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.borderColor = 'var(--text-disabled)'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    },
                  }, '+ Add'),
                ),
                // Note
                React.createElement('div', {
                  style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '8px', padding: '0 10px' },
                }, 'Changes take effect on next Claude Code session'),
              ),

          // Add modal
          showAddModal
            ? React.createElement('div', {
                style: {
                  marginTop: '12px', padding: '16px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
                },
              },
                React.createElement('div', {
                  style: { fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' },
                }, 'Add MCP Server'),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column' as const, gap: '8px' } },
                  React.createElement('input', {
                    placeholder: 'Name', value: newName,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value),
                    style: inputStyle,
                  }),
                  React.createElement('input', {
                    placeholder: 'Command (e.g. npx @modelcontextprotocol/...)', value: newCommand,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewCommand(e.target.value),
                    style: inputStyle,
                  }),
                  React.createElement('input', {
                    placeholder: 'Args (optional, space-separated)', value: newArgs,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewArgs(e.target.value),
                    style: inputStyle,
                  }),
                  // Scope
                  React.createElement('div', {
                    style: { display: 'flex', gap: '8px', alignItems: 'center' },
                  },
                    React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' } }, 'Save to:'),
                    React.createElement('button', {
                      onClick: () => setNewScope('global'),
                      style: {
                        padding: '3px 10px', fontSize: 'var(--text-xs)', cursor: 'pointer',
                        background: newScope === 'global' ? 'var(--bg-selected)' : 'transparent',
                        border: newScope === 'global' ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)', color: newScope === 'global' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      },
                    }, 'Global'),
                    React.createElement('button', {
                      onClick: () => setNewScope('project'),
                      style: {
                        padding: '3px 10px', fontSize: 'var(--text-xs)', cursor: 'pointer',
                        background: newScope === 'project' ? 'var(--bg-selected)' : 'transparent',
                        border: newScope === 'project' ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)', color: newScope === 'project' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      },
                    }, 'This project'),
                  ),
                  addError
                    ? React.createElement('p', { style: { color: 'var(--error)', fontSize: 'var(--text-xs)', margin: 0 } }, addError)
                    : null,
                  React.createElement('div', {
                    style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
                  },
                    React.createElement('button', {
                      onClick: () => setShowAddModal(false),
                      style: {
                        padding: '6px 14px', background: 'transparent', border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)',
                      },
                    }, 'Cancel'),
                    React.createElement('button', {
                      onClick: handleAdd,
                      disabled: !newName.trim() || !newCommand.trim(),
                      style: {
                        padding: '6px 14px', background: 'var(--accent)', border: 'none',
                        borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-xs)',
                        opacity: !newName.trim() || !newCommand.trim() ? 0.5 : 1,
                      },
                    }, 'Add Server'),
                  ),
                ),
              )
            : null,
        )
      : null
  )
}

export default MCPPanel
