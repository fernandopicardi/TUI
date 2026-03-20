// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { AgentSession } from '../types'

const CLAUDE_MODELS = [
  { id: 'claude-opus-4-5', label: 'Claude Opus 4.5', badge: 'Most capable' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', badge: 'Recommended' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', badge: 'Fastest' },
]

const MODES = [
  { id: 'normal' as const, label: 'Normal' },
  { id: 'plan' as const, label: 'Plan' },
  { id: 'auto' as const, label: 'Auto-accept' },
]

export function buildLaunchCommand(model: string, mode: string): string {
  const parts = ['claude']
  if (model !== 'claude-sonnet-4-5') parts.push('--model', model)
  if (mode === 'plan') parts.push('--plan')
  if (mode === 'auto') parts.push('--dangerously-skip-permissions')
  return parts.join(' ')
}

interface Props {
  agent: AgentSession
  projectName: string
  onLaunch: (config: { model: string; mode: 'normal' | 'plan' | 'auto'; initialPrompt?: string }) => void
}

const AgentLaunchPanel: React.FC<Props> = ({ agent, projectName, onLaunch }) => {
  const defaultModel = useStore(s => s.defaultModel)
  const defaultMode = useStore(s => s.defaultMode)
  const [model, setModel] = useState(defaultModel || 'claude-sonnet-4-5')
  const [mode, setMode] = useState<'normal' | 'plan' | 'auto'>(defaultMode || 'normal')
  const [initialPrompt, setInitialPrompt] = useState('')

  const handleLaunch = () => {
    onLaunch({
      model,
      mode,
      initialPrompt: initialPrompt.trim() || undefined,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: '#0a0a0a', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--text-base)',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '6px',
  }

  return React.createElement('div', {
    style: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: '32px',
    },
  },
    React.createElement('div', {
      style: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '32px',
      },
    },
      // Title
      React.createElement('div', {
        style: { fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' },
      }, 'Launch Claude Code'),
      React.createElement('div', {
        style: { fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '24px', fontFamily: 'Consolas, monospace' },
      }, `${agent.branch} \u00B7 ${projectName}`),

      // Model select
      React.createElement('div', { style: { marginBottom: '16px' } },
        React.createElement('label', { style: labelStyle }, 'Model'),
        React.createElement('select', {
          value: model,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setModel(e.target.value),
          style: {
            ...inputStyle, cursor: 'pointer', appearance: 'auto' as const,
          },
        },
          ...CLAUDE_MODELS.map(m =>
            React.createElement('option', { key: m.id, value: m.id },
              `${m.label}  \u2014  ${m.badge}`)
          ),
        ),
      ),

      // Mode radio buttons
      React.createElement('div', { style: { marginBottom: '16px' } },
        React.createElement('label', { style: labelStyle }, 'Mode'),
        React.createElement('div', {
          style: { display: 'flex', gap: '16px' },
        },
          ...MODES.map(m =>
            React.createElement('label', {
              key: m.id,
              style: {
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                color: mode === m.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
              },
            },
              React.createElement('input', {
                type: 'radio', name: 'mode', value: m.id, checked: mode === m.id,
                onChange: () => setMode(m.id),
                style: { accentColor: 'var(--accent)' },
              }),
              m.label,
            )
          ),
        ),
      ),

      // Initial prompt
      React.createElement('div', { style: { marginBottom: '24px' } },
        React.createElement('label', { style: labelStyle }, 'Initial prompt (optional)'),
        React.createElement('textarea', {
          value: initialPrompt,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInitialPrompt(e.target.value),
          placeholder: 'e.g. Implement the login page...',
          rows: 3,
          style: {
            ...inputStyle, fontFamily: 'Consolas, monospace', fontSize: 'var(--text-sm)',
            resize: 'vertical' as const, lineHeight: '1.5',
          },
        }),
      ),

      // Launch button
      React.createElement('button', {
        onClick: handleLaunch,
        style: {
          width: '100%', height: '40px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '6px', fontSize: 'var(--text-base)',
          fontWeight: 500, cursor: 'pointer', transition: 'opacity 150ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
      }, 'Launch agent'),
    ),
  )
}

export default AgentLaunchPanel
