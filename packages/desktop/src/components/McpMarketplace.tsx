// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/index'
import type { MCPServerEntry } from '../types'

interface McpInstallConfig {
  command?: string
  args?: string[]
  type?: 'url'
  url?: string
}

interface McpRegistryEntry {
  id: string
  name: string
  description: string
  installConfig: McpInstallConfig
}

const MCP_REGISTRY: McpRegistryEntry[] = [
  { id: 'playwright', name: 'Playwright', description: 'Browser automation with Playwright', installConfig: { command: 'npx', args: ['@playwright/mcp@latest'] } },
  { id: 'context7', name: 'Context7', description: 'Fetch up-to-date documentation for any library', installConfig: { command: 'npx', args: ['-y', '@upstash/context7-mcp@latest'] } },
  { id: 'vercel', name: 'Vercel', description: 'Analyze, debug, and manage Vercel projects', installConfig: { type: 'url', url: 'https://mcp.vercel.com' } },
  { id: 'sentry', name: 'Sentry', description: 'Search, query and debug errors', installConfig: { command: 'uvx', args: ['mcp-server-sentry', '--auth-token', 'YOUR_TOKEN'] } },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing and financial data', installConfig: { command: 'npx', args: ['-y', '@stripe/agent-toolkit@latest'] } },
  { id: 'figma', name: 'Figma', description: 'Generate diagrams and better code with Figma context', installConfig: { type: 'url', url: 'https://mcp.figma.com/mcp' } },
  { id: 'supabase', name: 'Supabase', description: 'Manage databases, authentication, and storage', installConfig: { type: 'url', url: 'https://mcp.supabase.com/mcp' } },
  { id: 'github', name: 'GitHub', description: 'Manage repositories, issues, and PRs', installConfig: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] } },
]

const McpMarketplace: React.FC = () => {
  const activeProject = useStore(s => s.projects.find(p => p.id === s.activeProjectId))
  const rootPath = activeProject?.rootPath || ''

  const [search, setSearch] = useState('')
  const [servers, setServers] = useState<MCPServerEntry[]>([])
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const showToast = useStore(s => s.showToast)

  const loadServers = useCallback(() => {
    if (!window.runnio?.mcp || !rootPath) return
    window.runnio.mcp.getConfig(rootPath)
      .then(setServers)
      .catch(() => {})
  }, [rootPath])

  useEffect(() => { loadServers() }, [loadServers])

  const handleRemove = async (name: string, scope: 'global' | 'project') => {
    if (!confirm(`Remove MCP server "${name}"?`)) return
    const result = await window.runnio.mcp.removeServer(rootPath, name, scope)
    if (result.success) {
      showToast(`Removed ${name}`, 'success')
      loadServers()
    }
  }

  const handleAddRecommended = async (entry: McpRegistryEntry) => {
    if (entry.installConfig.type === 'url') {
      // URL-based MCP — add as url type
      const result = await window.runnio.mcp.addServer(rootPath, {
        name: entry.id,
        command: entry.installConfig.url || '',
        args: [],
      }, 'global')
      if (result.success) {
        showToast(`Added ${entry.name}. Restart Claude Code for changes to take effect.`, 'success')
        loadServers()
      }
    } else {
      const result = await window.runnio.mcp.addServer(rootPath, {
        name: entry.id,
        command: entry.installConfig.command || '',
        args: entry.installConfig.args || [],
      }, 'global')
      if (result.success) {
        showToast(`Added ${entry.name}. Restart Claude Code for changes to take effect.`, 'success')
        loadServers()
      }
    }
  }

  const installedNames = servers.map(s => s.name.toLowerCase())
  const filteredRecommended = MCP_REGISTRY.filter(r =>
    !installedNames.includes(r.id.toLowerCase()) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) ||
     r.description.toLowerCase().includes(search.toLowerCase()))
  )

  const filteredInstalled = servers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return React.createElement('div', {
    style: {
      padding: '24px 32px', overflow: 'auto', height: '100%',
      backgroundColor: 'var(--bg-app)',
    },
  },
    // Header
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
    },
      React.createElement('h1', {
        style: { margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' },
      }, 'MCP Servers'),
      React.createElement('button', {
        onClick: () => setShowCustomModal(true),
        style: {
          padding: '7px 16px', backgroundColor: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '6px', fontSize: 'var(--text-sm)',
          cursor: 'pointer', fontWeight: 500,
        },
      }, '+ Custom MCP'),
    ),

    React.createElement('p', {
      style: { margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' },
    }, 'Connect your agents with external tools.'),

    // Search
    React.createElement('div', {
      style: { display: 'flex', gap: '8px', marginBottom: '20px' },
    },
      React.createElement('input', {
        type: 'text', value: search, placeholder: 'Search servers...',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
        style: {
          flex: 1, padding: '8px 12px',
          backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)',
          border: '1px solid var(--border-default)', borderRadius: '6px',
          fontSize: 'var(--text-sm)', outline: 'none',
        },
      }),
      React.createElement('button', {
        onClick: loadServers,
        style: {
          padding: '8px 12px', backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)', borderRadius: '6px',
          color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px',
        },
        title: 'Refresh',
      }, '\u21BA'),
    ),

    // Added section
    React.createElement('h3', {
      style: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    }, `Added (${filteredInstalled.length})`),

    filteredInstalled.length > 0
      ? React.createElement('div', {
          style: {
            marginBottom: '24px', borderRadius: '8px',
            border: '1px solid var(--border-default)', overflow: 'hidden',
          },
        },
          ...filteredInstalled.map((server, i) =>
            React.createElement('div', {
              key: server.name,
              style: {
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: i < filteredInstalled.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              },
            },
              React.createElement('span', {
                style: { color: 'var(--text-disabled)', fontSize: '14px' },
              }, '\u2630'),
              React.createElement('span', {
                style: { fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 500, minWidth: '120px' },
              }, server.name),
              React.createElement('span', {
                style: { fontSize: '12px', color: 'var(--text-disabled)', flex: 1 },
              }, server.command ? 'stdio' : 'http server'),
              React.createElement('span', {
                style: {
                  fontSize: '10px', color: 'var(--text-disabled)',
                  backgroundColor: 'var(--bg-app)', borderRadius: '3px',
                  padding: '2px 6px',
                },
              }, server.scope),
              React.createElement('button', {
                onClick: () => handleRemove(server.name, server.scope),
                style: {
                  background: 'none', border: 'none', color: 'var(--text-disabled)',
                  cursor: 'pointer', fontSize: '14px', padding: '2px 6px',
                  transition: 'color 100ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--error)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
                title: 'Remove server',
              }, '\u00D7'),
            ),
          ),
        )
      : React.createElement('div', {
          style: { marginBottom: '24px', fontSize: 'var(--text-sm)', color: 'var(--text-disabled)' },
        }, 'No MCP servers configured.'),

    // Recommended section
    React.createElement('h3', {
      style: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    }, 'Recommended'),

    React.createElement('div', {
      style: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px' },
    },
      ...filteredRecommended.map(entry =>
        React.createElement('div', {
          key: entry.id,
          style: {
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${hoveredCard === entry.id ? 'var(--accent)' : 'var(--border-default)'}`,
            borderRadius: '8px', padding: '14px 16px',
            transition: 'border-color 100ms',
            minWidth: '220px', flex: '1 1 220px', maxWidth: '320px',
          },
          onMouseEnter: () => setHoveredCard(entry.id),
          onMouseLeave: () => setHoveredCard(null),
        },
          React.createElement('div', {
            style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
          },
            React.createElement('span', { style: { color: 'var(--text-disabled)', fontSize: '14px' } }, '\u2630'),
            React.createElement('span', {
              style: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' },
            }, entry.name),
          ),
          React.createElement('div', {
            style: { fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.3', marginBottom: '10px' },
          }, entry.description),
          React.createElement('button', {
            onClick: () => handleAddRecommended(entry),
            style: {
              padding: '4px 12px', backgroundColor: 'transparent',
              border: '1px solid var(--accent)', borderRadius: '4px',
              color: 'var(--accent)', cursor: 'pointer', fontSize: '11px',
              float: 'right' as const,
            },
          }, '+ Add'),
        ),
      ),
    ),

    // Custom MCP modal
    showCustomModal
      ? React.createElement(CustomMcpModal, {
          rootPath,
          onClose: () => { setShowCustomModal(false); loadServers() },
        })
      : null,
  )
}

// ── Custom MCP Modal ──
interface CustomMcpModalProps {
  rootPath: string
  onClose: () => void
}

const CustomMcpModal: React.FC<CustomMcpModalProps> = ({ rootPath, onClose }) => {
  const [name, setName] = useState('')
  const [type, setType] = useState<'stdio' | 'url'>('stdio')
  const [command, setCommand] = useState('')
  const [args, setArgs] = useState('')
  const [url, setUrl] = useState('')
  const [scope, setScope] = useState<'global' | 'project'>('global')
  const showToast = useStore(s => s.showToast)

  const handleAdd = async () => {
    if (!name.trim()) return
    if (type === 'stdio' && !command.trim()) return
    if (type === 'url' && !url.trim()) return

    const server = type === 'stdio'
      ? { name: name.trim(), command: command.trim(), args: args.trim() ? args.trim().split(/\s+/) : [] }
      : { name: name.trim(), command: url.trim(), args: [] }

    const result = await window.runnio.mcp.addServer(rootPath, server, scope)
    if (result.success) {
      showToast(`Added ${name}. Restart Claude Code for changes to take effect.`, 'success')
      onClose()
    } else {
      showToast('Failed to add MCP server', 'warning')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', boxSizing: 'border-box' as const,
    backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
    border: '1px solid var(--border-default)', borderRadius: '6px',
    fontSize: 'var(--text-sm)', outline: 'none',
  }

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    onClick: (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose() },
  },
    React.createElement('div', {
      style: {
        width: '420px', backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px', padding: '24px',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      },
    },
      React.createElement('h3', {
        style: { margin: '0 0 16px', fontSize: '16px', color: 'var(--text-primary)' },
      }, 'Add Custom MCP Server'),

      // Name
      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('label', {
          style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
        }, 'Server name'),
        React.createElement('input', {
          type: 'text', value: name, placeholder: 'my-server',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
          style: inputStyle,
        }),
      ),

      // Type
      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('label', {
          style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
        }, 'Type'),
        React.createElement('select', {
          value: type,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as 'stdio' | 'url'),
          style: { ...inputStyle, cursor: 'pointer' },
        },
          React.createElement('option', { value: 'stdio' }, 'stdio'),
          React.createElement('option', { value: 'url' }, 'HTTP / URL'),
        ),
      ),

      // Command / URL
      type === 'stdio'
        ? React.createElement(React.Fragment, null,
            React.createElement('div', { style: { marginBottom: '12px' } },
              React.createElement('label', {
                style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
              }, 'Command'),
              React.createElement('input', {
                type: 'text', value: command, placeholder: 'npx',
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCommand(e.target.value),
                style: inputStyle,
              }),
            ),
            React.createElement('div', { style: { marginBottom: '12px' } },
              React.createElement('label', {
                style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
              }, 'Arguments (space-separated)'),
              React.createElement('input', {
                type: 'text', value: args, placeholder: '-y @my/mcp-server',
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setArgs(e.target.value),
                style: inputStyle,
              }),
            ),
          )
        : React.createElement('div', { style: { marginBottom: '12px' } },
            React.createElement('label', {
              style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
            }, 'URL'),
            React.createElement('input', {
              type: 'text', value: url, placeholder: 'https://mcp.example.com',
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value),
              style: inputStyle,
            }),
          ),

      // Scope
      React.createElement('div', { style: { marginBottom: '16px' } },
        React.createElement('label', {
          style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
        }, 'Scope'),
        React.createElement('select', {
          value: scope,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setScope(e.target.value as 'global' | 'project'),
          style: { ...inputStyle, cursor: 'pointer' },
        },
          React.createElement('option', { value: 'global' }, 'Global (~/.claude/settings.json)'),
          React.createElement('option', { value: 'project' }, 'Project (.claude/settings.json)'),
        ),
      ),

      // Actions
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
      },
        React.createElement('button', {
          onClick: onClose,
          style: {
            padding: '7px 16px', backgroundColor: 'transparent',
            border: '1px solid var(--border-default)', borderRadius: '6px',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          },
        }, 'Cancel'),
        React.createElement('button', {
          onClick: handleAdd,
          disabled: !name.trim(),
          style: {
            padding: '7px 16px',
            backgroundColor: name.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
            border: 'none', borderRadius: '6px',
            color: name.trim() ? '#fff' : 'var(--text-disabled)',
            cursor: name.trim() ? 'pointer' : 'default',
            fontSize: 'var(--text-sm)', fontWeight: 500,
          },
        }, 'Add Server'),
      ),
    ),
  )
}

export default McpMarketplace
