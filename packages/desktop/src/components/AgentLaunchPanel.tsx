// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { AgentSession } from '../types'
import { CLI_PROVIDERS, CliProvider, getProviderById, buildLaunchCommand as buildProviderCommand } from '../data/providers'
import { ArrowRight } from 'lucide-react'

// Re-export for backwards compatibility with Workspace.tsx
export function buildLaunchCommand(model: string, mode: string): string {
  const provider = CLI_PROVIDERS[0] // claude
  return buildProviderCommand(provider, model || undefined, mode as any)
}

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

interface Props {
  agent: AgentSession
  projectName: string
  onLaunch: (config: { model: string; mode: 'normal' | 'plan' | 'auto'; initialPrompt?: string; providerId?: string }) => void
}

const AgentLaunchPanel: React.FC<Props> = ({ agent, projectName, onLaunch }) => {
  const defaultModel = useStore(s => s.defaultModel)
  const defaultMode = useStore(s => s.defaultMode)
  const [providerId, setProviderId] = useState(agent.providerId || 'claude')
  const [model, setModel] = useState(defaultModel || 'claude-sonnet-4-5')
  const [customModel, setCustomModel] = useState('')
  const [mode, setMode] = useState<'normal' | 'plan' | 'auto'>(defaultMode || 'normal')
  const [initialPrompt, setInitialPrompt] = useState('')
  const [detectedProviders, setDetectedProviders] = useState<Record<string, boolean>>({})
  const [detecting, setDetecting] = useState(true)

  // Detect CLI providers on mount
  useEffect(() => {
    window.runnio.agents.detectAll()
      .then(results => { setDetectedProviders(results); setDetecting(false) })
      .catch(() => setDetecting(false))
  }, [])

  const provider = getProviderById(providerId) || CLI_PROVIDERS[0]
  const isClaude = providerId === 'claude'
  const effectiveModel = isClaude ? model : customModel

  const commandPreview = buildProviderCommand(provider, effectiveModel || undefined, mode)

  const handleLaunch = () => {
    onLaunch({
      model: effectiveModel,
      mode,
      initialPrompt: initialPrompt.trim() || undefined,
      providerId,
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-app)', border: '1px solid var(--border-default)',
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
      }, 'Launch Agent'),
      React.createElement('div', {
        style: { fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '24px', fontFamily: 'Consolas, monospace' },
      }, `${agent.branch} \u00B7 ${projectName}`),

      // Provider selector
      React.createElement('div', { style: { marginBottom: '16px' } },
        React.createElement('label', { style: labelStyle }, 'Provider'),
        detecting
          ? React.createElement('div', {
              style: { padding: '8px 12px', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' },
            }, 'Detecting CLI agents...')
          : React.createElement('div', {
              style: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px' },
            },
              ...CLI_PROVIDERS.map(p => {
                const detected = detectedProviders[p.id] !== false
                const isSelected = providerId === p.id
                return React.createElement('button', {
                  key: p.id,
                  onClick: () => detected && setProviderId(p.id),
                  style: {
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px',
                    background: isSelected ? `${p.color}15` : 'transparent',
                    border: `1px solid ${isSelected ? p.color + '66' : 'var(--border-default)'}`,
                    borderRadius: '6px', cursor: detected ? 'pointer' : 'default',
                    color: detected ? (isSelected ? p.color : 'var(--text-secondary)') : 'var(--text-disabled)',
                    fontSize: '12px', transition: 'all 100ms',
                    opacity: detected ? 1 : 0.5,
                  },
                  title: detected ? p.name : `${p.name} — not detected`,
                },
                  React.createElement('span', { style: { display: 'flex', alignItems: 'center' } }, React.createElement(p.Icon, { size: 14 })),
                  React.createElement('span', null, p.name),
                  !detected
                    ? React.createElement('a', {
                        href: '#',
                        onClick: (e: React.MouseEvent) => {
                          e.preventDefault()
                          e.stopPropagation()
                          navigator.clipboard.writeText(p.installUrl).catch(() => {})
                          useStore.getState().showToast('Install URL copied', 'info')
                        },
                        style: { color: 'var(--accent)', fontSize: '10px', textDecoration: 'none' },
                      }, 'Install ', React.createElement(ArrowRight, { size: 10 }))
                    : null,
                )
              }),
            ),
      ),

      // Model select (Claude) or free text (others)
      React.createElement('div', { style: { marginBottom: '16px' } },
        React.createElement('label', { style: labelStyle }, 'Model'),
        isClaude
          ? React.createElement('select', {
              value: model,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setModel(e.target.value),
              style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
            },
              ...CLAUDE_MODELS.map(m =>
                React.createElement('option', { key: m.id, value: m.id },
                  `${m.label}  \u2014  ${m.badge}`)
              ),
            )
          : React.createElement('input', {
              type: 'text',
              value: customModel,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomModel(e.target.value),
              placeholder: 'Model name (optional)',
              style: inputStyle,
            }),
      ),

      // Mode radio buttons (only show if provider supports flags)
      (provider.planFlag || provider.autoApproveFlag)
        ? React.createElement('div', { style: { marginBottom: '16px' } },
            React.createElement('label', { style: labelStyle }, 'Mode'),
            React.createElement('div', {
              style: { display: 'flex', gap: '16px' },
            },
              ...MODES.filter(m => {
                if (m.id === 'plan') return !!provider.planFlag
                if (m.id === 'auto') return !!provider.autoApproveFlag
                return true
              }).map(m =>
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
          )
        : null,

      // Initial prompt
      React.createElement('div', { style: { marginBottom: '16px' } },
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

      // Command preview
      React.createElement('div', {
        style: {
          padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)',
          borderRadius: '6px', marginBottom: '20px', fontFamily: 'Consolas, monospace',
          fontSize: '12px', color: 'var(--text-tertiary)',
        },
      },
        React.createElement('span', { style: { color: 'var(--text-disabled)', marginRight: '6px' } }, 'Preview:'),
        React.createElement('span', { style: { color: 'var(--text-secondary)' } }, commandPreview),
      ),

      // Launch button
      React.createElement('button', {
        onClick: handleLaunch,
        style: {
          width: '100%', height: '40px', background: provider.color || 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '6px', fontSize: 'var(--text-base)',
          fontWeight: 500, cursor: 'pointer', transition: 'opacity 150ms',
        },
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
      }, `Launch ${provider.name}`),
    ),
  )
}

export default AgentLaunchPanel
