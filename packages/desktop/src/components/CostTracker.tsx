// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'

interface TokenUsage {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  costUsd: number
}

interface Props {
  usage: TokenUsage | undefined
  variant: 'full' | 'compact' | 'badge'
}

function formatTokens(n: number): string {
  if (n === 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

function formatCost(usd: number): string {
  if (usd === 0) return '$0.00'
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  if (usd < 1) return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(2)}`
}

/**
 * CostTracker displays token usage and cost for an agent session.
 *
 * Variants:
 * - "full"    — detailed panel with token breakdown (Workspace header)
 * - "compact" — single line with cost + token summary (Workspace nav row)
 * - "badge"   — tiny cost-only badge (AgentBar card)
 */
const CostTracker: React.FC<Props> = ({ usage, variant }) => {
  if (!usage || (usage.input === 0 && usage.output === 0 && usage.costUsd === 0)) {
    if (variant === 'badge') return null
    return React.createElement('span', {
      style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' },
    }, variant === 'full' ? 'No usage data yet' : null)
  }

  // Badge variant — tiny cost pill for AgentBar
  if (variant === 'badge') {
    return React.createElement('span', {
      title: `${formatTokens(usage.input)} in / ${formatTokens(usage.output)} out`,
      style: {
        fontSize: '9px',
        color: 'var(--text-tertiary)',
        background: 'rgba(99,102,241,0.08)',
        padding: '0px 5px',
        borderRadius: '6px',
        fontFamily: '"Cascadia Code", Consolas, monospace',
        whiteSpace: 'nowrap' as const,
      },
    }, formatCost(usage.costUsd))
  }

  // Compact variant — inline in Workspace nav row
  if (variant === 'compact') {
    return React.createElement('div', {
      title: `Input: ${formatTokens(usage.input)} | Output: ${formatTokens(usage.output)}${usage.cacheRead ? ` | Cache read: ${formatTokens(usage.cacheRead)}` : ''}`,
      style: {
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
        padding: '1px 8px', borderRadius: '8px',
        background: 'rgba(99,102,241,0.06)',
        fontFamily: '"Cascadia Code", Consolas, monospace',
      },
    },
      // Cost icon
      React.createElement('svg', {
        width: 10, height: 10, viewBox: '0 0 16 16', fill: 'none',
        style: { color: 'var(--accent)', flexShrink: 0 },
      },
        React.createElement('circle', { cx: 8, cy: 8, r: 7, stroke: 'currentColor', strokeWidth: 1.5 }),
        React.createElement('text', {
          x: 8, y: 11.5, textAnchor: 'middle', fill: 'currentColor',
          fontSize: '10', fontWeight: 600, fontFamily: 'inherit',
        }, '$'),
      ),
      React.createElement('span', null, formatCost(usage.costUsd)),
      React.createElement('span', { style: { color: 'var(--text-disabled)' } }, '|'),
      React.createElement('span', null, `${formatTokens(usage.input)} in`),
      React.createElement('span', { style: { color: 'var(--text-disabled)' } }, '/'),
      React.createElement('span', null, `${formatTokens(usage.output)} out`),
    )
  }

  // Full variant — detailed breakdown panel
  const totalTokens = usage.input + usage.output

  const StatRow = (label: string, value: string, color?: string) =>
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' },
    },
      React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' } }, label),
      React.createElement('span', {
        style: {
          color: color || 'var(--text-primary)', fontSize: 'var(--text-xs)',
          fontFamily: '"Cascadia Code", Consolas, monospace', fontWeight: 500,
        },
      }, value),
    )

  return React.createElement('div', {
    style: {
      display: 'flex', flexDirection: 'column' as const, gap: '2px',
      padding: '10px 14px',
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)',
    },
  },
    // Header
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '6px',
      },
    },
      React.createElement('span', {
        style: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' },
      }, 'Token Usage'),
      React.createElement('span', {
        style: {
          fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent)',
          fontFamily: '"Cascadia Code", Consolas, monospace',
        },
      }, formatCost(usage.costUsd)),
    ),

    // Stats
    StatRow('Input tokens', formatTokens(usage.input)),
    StatRow('Output tokens', formatTokens(usage.output)),
    usage.cacheRead > 0 ? StatRow('Cache read', formatTokens(usage.cacheRead), 'var(--text-tertiary)') : null,
    usage.cacheWrite > 0 ? StatRow('Cache write', formatTokens(usage.cacheWrite), 'var(--text-tertiary)') : null,

    // Divider
    React.createElement('div', {
      style: { height: '1px', background: 'var(--border-subtle)', margin: '4px 0' },
    }),

    StatRow('Total tokens', formatTokens(totalTokens)),

    // Visual token distribution bar
    totalTokens > 0
      ? React.createElement('div', {
          style: {
            display: 'flex', height: '3px', borderRadius: '2px',
            overflow: 'hidden', marginTop: '4px',
            background: 'var(--bg-app)',
          },
        },
          React.createElement('div', {
            title: `Input: ${((usage.input / totalTokens) * 100).toFixed(0)}%`,
            style: {
              width: `${(usage.input / totalTokens) * 100}%`,
              background: 'var(--accent)',
              transition: 'width 300ms',
            },
          }),
          React.createElement('div', {
            title: `Output: ${((usage.output / totalTokens) * 100).toFixed(0)}%`,
            style: {
              width: `${(usage.output / totalTokens) * 100}%`,
              background: '#7c3aed',
              transition: 'width 300ms',
            },
          }),
        )
      : null,

    // Legend
    totalTokens > 0
      ? React.createElement('div', {
          style: { display: 'flex', gap: '12px', marginTop: '4px', fontSize: '9px', color: 'var(--text-disabled)' },
        },
          React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '3px' } },
            React.createElement('span', { style: { width: '6px', height: '6px', borderRadius: '1px', background: 'var(--accent)' } }),
            'input',
          ),
          React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '3px' } },
            React.createElement('span', { style: { width: '6px', height: '6px', borderRadius: '1px', background: '#7c3aed' } }),
            'output',
          ),
        )
      : null,
  )
}

export default CostTracker
