// ── Settings Audit (fix-4/settings-functional) ──────────────────────────────
//
// WORKS — saves AND app behavior changes:
//   defaultModel        → store, read by AgentLaunchPanel
//   defaultMode         → store, read by AgentLaunchPanel
//   theme               → store + applyTheme, immediate
//   githubToken         → global settings file, read by PRPanel
//   terminalFont        → store, read by Terminal.tsx (live apply via xterm.options)
//   terminalFontSize    → store, read by Terminal.tsx (live apply via xterm.options)
//   refreshInterval     → store, read by useAgentStatusWatcher hook
//   createWorktreeByDefault → store, read by CreateAgentModal
//   branchPattern       → store, read by CreateAgentModal
//   notifications       → store, read by useAgentStatusWatcher (Electron Notification API)
//
// REMOVED — was visual-only or saved but nothing consumed:
//   openCommand         → redundant with provider system in AgentLaunchPanel
//   autoGenerateTaskNames → no task generation system exists
//   soundCues           → no sound system exists
//   autoTrustWorktrees  → confusing UX, redundant with launch panel mode selector
//   autoApproveByDefault → redundant with launch panel mode selector
//   autoPush            → needs main.ts worktree creation changes (deferred)
//   worktreeLocation    → needs main.ts worktree creation changes (deferred)
//   Linear/Jira/GitLab/Asana integration cards → no API integration
//   Sign in with GitHub (OAuth) → no OAuth server
//
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/index'
import { Theme, applyTheme } from '../styles/themes'
import { Sparkles, Target, Gem, Hexagon, Zap, SquareCode, Circle, Play, Palette, X, Check, ExternalLink, Copy } from 'lucide-react'

type Section = 'general' | 'agents' | 'integrations' | 'repository' | 'interface' | 'account'

const CLI_AGENTS = [
  { id: 'claude', name: 'Claude Code', Icon: Sparkles, installCmd: 'npm install -g @anthropic-ai/claude-code', docs: 'https://docs.anthropic.com/claude-code' },
  { id: 'codex', name: 'Codex', Icon: Target, installCmd: 'npm install -g @openai/codex', docs: 'https://github.com/openai/codex' },
  { id: 'gemini', name: 'Gemini CLI', Icon: Gem, installCmd: 'npm install -g @google/gemini-cli', docs: 'https://github.com/google-gemini/gemini-cli' },
  { id: 'opencode', name: 'OpenCode', Icon: Hexagon, installCmd: 'npm install -g opencode-ai', docs: 'https://opencode.ai' },
  { id: 'amp', name: 'Amp', Icon: Zap, installCmd: '', docs: 'https://ampcode.com' },
  { id: 'cline', name: 'Cline', Icon: Circle, installCmd: 'npm install -g cline', docs: 'https://github.com/cline/cline' },
  { id: 'continue', name: 'Continue', Icon: Play, installCmd: '', docs: 'https://continue.dev' },
  { id: 'aider', name: 'Aider', Icon: Palette, installCmd: 'pip install aider-chat', docs: 'https://aider.chat' },
]

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'agents', label: 'Agents' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'repository', label: 'Repository' },
  { id: 'interface', label: 'Interface' },
  { id: 'account', label: 'Account' },
]

declare const __RUNNIO_DEV__: string

const SettingsModal: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('general')

  const onClose = useCallback(() => {
    useStore.getState().closeSettings()
  }, [])

  // Store-backed settings (live)
  const defaultModel = useStore(s => s.defaultModel)
  const defaultMode = useStore(s => s.defaultMode)
  const theme = useStore(s => s.theme)
  const terminalFont = useStore(s => s.terminalFont)
  const terminalFontSize = useStore(s => s.terminalFontSize)
  const refreshInterval = useStore(s => s.refreshInterval)
  const createWorktreeByDefault = useStore(s => s.createWorktreeByDefault)
  const branchPattern = useStore(s => s.branchPattern)
  const notifications = useStore(s => s.notifications)

  // GitHub settings (file-backed)
  const [githubToken, setGithubToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; login?: string } | null>(null)
  const [testing, setTesting] = useState(false)

  // CLI agent detection
  const [detectedAgents, setDetectedAgents] = useState<Record<string, boolean>>({})
  const [detecting, setDetecting] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)

  // Load file-backed settings on mount
  useEffect(() => {
    window.runnio.settings.readGlobal().then((data) => {
      if (data.githubToken) setGithubToken(data.githubToken)
    })
  }, [])

  // Detect CLI agents when section opens
  useEffect(() => {
    if (activeSection === 'agents') {
      setDetecting(true)
      window.runnio.agents.detectAll()
        .then(setDetectedAgents)
        .catch(() => {})
        .finally(() => setDetecting(false))
    }
  }, [activeSection])

  const handleSaveGithubToken = async () => {
    await window.runnio.settings.writeGlobal({
      githubToken: githubToken || undefined,
    })
    useStore.getState().showToast('GitHub token saved', 'success')
  }

  const handleTestGithub = async () => {
    if (!githubToken.trim()) return
    setTesting(true)
    setTestResult(null)
    const result = await window.runnio.settings.testGithub(githubToken)
    setTestResult(result)
    setTesting(false)
    if (result.success) {
      // Auto-save on successful test
      await window.runnio.settings.writeGlobal({ githubToken })
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    useStore.getState().setTheme(newTheme)
    applyTheme(newTheme)
  }

  const handleCopyInstall = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd).catch(() => {})
    setCopiedCmd(id)
    setTimeout(() => setCopiedCmd(null), 2000)
  }

  // Shared styles
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-app)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--text-base)',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px',
  }

  const sectionHeaderStyle: React.CSSProperties = {
    color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: '12px', marginTop: '20px',
  }

  const toggleStyle = (on: boolean): React.CSSProperties => ({
    width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
    background: on ? 'var(--accent)' : 'var(--border-strong)',
    border: 'none', position: 'relative' as const, transition: 'background 150ms',
    flexShrink: 0,
  })

  const toggleDot = (on: boolean): React.CSSProperties => ({
    width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
    position: 'absolute' as const, top: '3px', left: on ? '19px' : '3px',
    transition: 'left 150ms',
  })

  const toggleRow = (label: string, value: boolean, onChange: (v: boolean) => void, description?: string) =>
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' },
    },
      React.createElement('div', null,
        React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)' } }, label),
        description
          ? React.createElement('div', { style: { color: 'var(--text-disabled)', fontSize: '10px', marginTop: '2px' } }, description)
          : null,
      ),
      React.createElement('button', {
        onClick: () => onChange(!value),
        style: toggleStyle(value),
      },
        React.createElement('div', { style: toggleDot(value) }),
      ),
    )

  // Branch pattern preview
  const branchPreview = branchPattern
    .replace('{branch}', 'my-feature')
    .replace('{date}', '20260322')
    .replace('{user}', 'dev')

  // ── Section renders ──

  const renderGeneral = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    },
      // Default model — saves to store immediately
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Default model'),
        React.createElement('select', {
          value: defaultModel,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => useStore.getState().setDefaultModel(e.target.value),
          style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
        },
          React.createElement('option', { value: '' }, 'Default (CLI default)'),
          React.createElement('option', { value: 'claude-opus-4-6' }, 'Claude Opus 4.6'),
          React.createElement('option', { value: 'claude-sonnet-4-6' }, 'Claude Sonnet 4.6'),
          React.createElement('option', { value: 'claude-haiku-4-5' }, 'Claude Haiku 4.5'),
        ),
        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: '10px', marginTop: '4px' },
        }, 'Pre-selected when launching a new agent'),
      ),
      // Default mode
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Default mode'),
        React.createElement('select', {
          value: defaultMode,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => useStore.getState().setDefaultMode(e.target.value as any),
          style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
        },
          React.createElement('option', { value: 'normal' }, 'Normal'),
          React.createElement('option', { value: 'plan' }, 'Plan'),
          React.createElement('option', { value: 'auto' }, 'Auto-accept'),
        ),
      ),
      // Refresh interval — saves to store immediately
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, `Status polling: ${refreshInterval}ms`),
        React.createElement('input', {
          type: 'range', min: 1000, max: 10000, step: 500,
          value: refreshInterval,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => useStore.getState().setRefreshInterval(Number(e.target.value)),
          style: { width: '100%', accentColor: 'var(--accent)' },
        }),
        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: '10px', marginTop: '2px' },
        }, 'How often to check agent status. Lower = more responsive, higher = less CPU'),
      ),
      React.createElement('div', { style: sectionHeaderStyle }, 'Preferences'),
      toggleRow('Create worktree by default', createWorktreeByDefault,
        (v) => useStore.getState().setCreateWorktreeByDefault(v),
        'New agents start with an isolated worktree checked by default'),
      toggleRow('Notifications', notifications,
        (v) => useStore.getState().setNotifications(v),
        'Show desktop notification when an agent needs attention'),
    )

  const renderAgents = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    },
      React.createElement('div', { style: sectionHeaderStyle }, 'CLI Agents'),
      detecting
        ? React.createElement('div', {
            style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', padding: '8px 0' },
          }, 'Detecting installed agents...')
        : React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
          },
            ...CLI_AGENTS.map(agent => {
              const detected = detectedAgents[agent.id] === true
              return React.createElement('div', {
                key: agent.id,
                style: {
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', background: 'var(--bg-app)',
                  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                },
              },
                React.createElement('span', {
                  style: { width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                }, React.createElement(agent.Icon, { size: 16 })),
                React.createElement('span', {
                  style: { flex: 1, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' },
                }, agent.name),
                React.createElement('span', {
                  style: {
                    fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                    background: detected ? '#0d1a0d' : 'transparent',
                    border: '1px solid ' + (detected ? 'var(--working)' : 'var(--border-default)'),
                    color: detected ? 'var(--working)' : 'var(--text-disabled)',
                  },
                }, detected ? 'Detected' : 'Not detected'),
                !detected && agent.installCmd
                  ? React.createElement('button', {
                      onClick: () => handleCopyInstall(agent.installCmd, agent.id),
                      style: {
                        padding: '2px 8px', background: 'transparent',
                        border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                        color: copiedCmd === agent.id ? 'var(--working)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '10px', transition: 'all 100ms',
                        display: 'flex', alignItems: 'center', gap: '3px',
                      },
                    },
                      React.createElement(Copy, { size: 10 }),
                      copiedCmd === agent.id ? 'Copied!' : 'Install',
                    )
                  : null,
              )
            }),
          ),
    )

  const renderIntegrations = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    },
      // GitHub — inline token input
      React.createElement('div', {
        style: {
          padding: '14px', background: 'var(--bg-app)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
        },
      },
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
        },
          React.createElement('span', {
            style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500 },
          }, 'GitHub'),
          testResult?.success
            ? React.createElement('span', {
                style: { fontSize: '11px', color: 'var(--working)', display: 'flex', alignItems: 'center', gap: '4px' },
              }, React.createElement(Check, { size: 12 }), 'Connected as @' + (testResult.login || ''))
            : null,
        ),
        React.createElement('div', {
          style: { display: 'flex', gap: '6px', marginBottom: '6px' },
        },
          React.createElement('input', {
            type: showToken ? 'text' : 'password', value: githubToken,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGithubToken(e.target.value),
            placeholder: 'ghp_...',
            style: { ...inputStyle, flex: 1, fontFamily: 'Consolas, monospace', fontSize: '12px' },
          }),
          React.createElement('button', {
            onClick: () => setShowToken(!showToken),
            style: {
              padding: '6px 10px', background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px',
            },
          }, showToken ? 'Hide' : 'Show'),
          React.createElement('button', {
            onClick: handleTestGithub,
            disabled: testing || !githubToken.trim(),
            style: {
              padding: '6px 10px', background: testing ? 'transparent' : 'var(--accent)', border: 'none',
              borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: '11px',
              opacity: testing || !githubToken.trim() ? 0.5 : 1,
            },
          }, testing ? 'Testing...' : 'Test & Save'),
        ),
        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: '10px' },
        }, 'Required scopes: repo, pull_requests. ',
          React.createElement('a', {
            href: '#',
            onClick: (e: React.MouseEvent) => {
              e.preventDefault()
              navigator.clipboard.writeText('https://github.com/settings/tokens/new?scopes=repo').catch(() => {})
              useStore.getState().showToast('Token creation URL copied', 'info')
            },
            style: { color: 'var(--accent)', textDecoration: 'none' },
          }, 'Create token'),
        ),
        testResult && !testResult.success
          ? React.createElement('div', {
              style: {
                marginTop: '8px', padding: '8px', borderRadius: 'var(--radius-md)',
                background: '#1a0d0d', border: '1px solid var(--error)',
                color: 'var(--error)', fontSize: '12px',
              },
            }, React.createElement(X, { size: 12, style: { display: 'inline', verticalAlign: 'middle' } }), ' Authentication failed')
          : null,
      ),
      // Notion — MCP status
      React.createElement('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', background: 'var(--bg-app)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
        },
      },
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '10px' },
        },
          React.createElement('span', {
            style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500 },
          }, 'Notion'),
          React.createElement('span', {
            style: {
              fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-tertiary)',
            },
          }, 'via MCP'),
        ),
        React.createElement('span', {
          style: { fontSize: '11px', color: 'var(--text-disabled)' },
        }, 'Configure in MCP panel'),
      ),
    )

  const renderRepository = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    },
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Branch name pattern'),
        React.createElement('input', {
          type: 'text', value: branchPattern,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => useStore.getState().setBranchPattern(e.target.value),
          style: { ...inputStyle, fontFamily: 'Consolas, monospace' },
        }),
        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: '10px', marginTop: '4px' },
        }, 'Variables: {branch} (user input), {date} (YYYYMMDD), {user}'),
        React.createElement('div', {
          style: { color: 'var(--text-tertiary)', fontSize: '11px', marginTop: '4px', fontFamily: 'Consolas, monospace' },
        }, 'Preview: ' + branchPreview),
      ),
    )

  const renderInterface = () => {
    const themes: { id: Theme; label: string; swatch: string }[] = [
      { id: 'light', label: 'Light', swatch: '#ffffff' },
      { id: 'dark', label: 'Dark', swatch: '#0a0a0a' },
      { id: 'dark-navy', label: 'Dark Navy', swatch: '#0d1117' },
      { id: 'system', label: 'System', swatch: 'linear-gradient(135deg, #ffffff 50%, #0a0a0a 50%)' },
    ]

    return React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
    },
      // Theme selector — applies immediately
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Color mode'),
        React.createElement('div', {
          style: { display: 'flex', gap: '8px', marginTop: '6px' },
        },
          ...themes.map(t =>
            React.createElement('button', {
              key: t.id,
              onClick: () => handleThemeChange(t.id),
              style: {
                flex: 1, display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: '6px', padding: '10px 8px',
                background: 'var(--bg-app)', border: theme === t.id ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 150ms',
              },
            },
              React.createElement('div', {
                style: {
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '1px solid var(--border-strong)',
                  background: t.swatch,
                },
              }),
              React.createElement('span', {
                style: { fontSize: '11px', color: theme === t.id ? 'var(--accent)' : 'var(--text-secondary)' },
              }, t.label),
            )
          ),
        ),
      ),
      // Terminal font — applies immediately via store
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Terminal font'),
        React.createElement('select', {
          value: terminalFont,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => useStore.getState().setTerminalFont(e.target.value),
          style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
        },
          React.createElement('option', { value: 'Consolas' }, 'Consolas (default)'),
          React.createElement('option', { value: 'Cascadia Code' }, 'Cascadia Code'),
          React.createElement('option', { value: 'JetBrains Mono' }, 'JetBrains Mono'),
          React.createElement('option', { value: 'Fira Code' }, 'Fira Code'),
          React.createElement('option', { value: 'Courier New' }, 'Courier New'),
        ),
        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: '10px', marginTop: '2px' },
        }, 'Applied immediately to all terminal instances'),
      ),
      // Terminal font size — applies immediately via store
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, `Terminal font size: ${terminalFontSize}px`),
        React.createElement('input', {
          type: 'range', min: 10, max: 20, step: 1,
          value: terminalFontSize,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => useStore.getState().setTerminalFontSize(Number(e.target.value)),
          style: { width: '100%', accentColor: 'var(--accent)' },
        }),
      ),
      // Keyboard shortcuts
      React.createElement('div', { style: sectionHeaderStyle }, 'Keyboard Shortcuts'),
      React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
      },
        ...[
          ['Ctrl+Shift+P', 'Add project'],
          ['Ctrl+N', 'New agent'],
          ['Ctrl+K', 'Command palette'],
          ['Ctrl+Space', 'Quick prompt'],
          ['Ctrl+E', 'File explorer'],
          ['Ctrl+,', 'Settings'],
          ['Ctrl+\\', 'Split terminal'],
          ['Ctrl+W', 'Close agent'],
          ['Escape', 'Close modal'],
        ].map(([key, action]) =>
          React.createElement('div', {
            key: key,
            style: {
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 0',
            },
          },
            React.createElement('span', {
              style: { color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' },
            }, action),
            React.createElement('kbd', {
              style: {
                padding: '2px 6px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'Consolas, monospace',
              },
            }, key),
          )
        ),
      ),
    )
  }

  const renderAccount = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
    },
      // GitHub token status
      React.createElement('div', {
        style: {
          padding: '16px', background: 'var(--bg-app)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
        },
      },
        React.createElement('div', {
          style: { color: 'var(--text-primary)', fontSize: 'var(--text-md)', fontWeight: 500, marginBottom: '6px' },
        }, 'GitHub'),
        githubToken && testResult?.success
          ? React.createElement('div', {
              style: { display: 'flex', alignItems: 'center', gap: '8px' },
            },
              React.createElement('span', { style: { color: 'var(--working)', fontSize: 'var(--text-sm)' } },
                '\u2713 Connected as @' + (testResult.login || '')),
              React.createElement('button', {
                onClick: () => { setGithubToken(''); setTestResult(null); window.runnio.settings.writeGlobal({ githubToken: undefined }) },
                style: {
                  padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '10px',
                },
              }, 'Disconnect'),
            )
          : React.createElement('div', { style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' } },
              'Not connected. Go to Integrations to add your token.'),
      ),
      // Developer mode
      React.createElement('div', {
        style: { borderTop: '1px solid var(--border-default)', paddingTop: '16px' },
      },
        React.createElement('div', { style: sectionHeaderStyle }, 'Developer Mode'),
        React.createElement('div', {
          style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' },
        }, (typeof __RUNNIO_DEV__ !== 'undefined' && __RUNNIO_DEV__ === 'true')
          ? 'RUNNIO_DEV=true is active \u2014 all features unlocked'
          : 'Set RUNNIO_DEV=true to unlock all features during development'
        ),
      ),
    )

  const sectionRenderers: Record<Section, () => React.ReactElement> = {
    general: renderGeneral,
    agents: renderAgents,
    integrations: renderIntegrations,
    repository: renderRepository,
    interface: renderInterface,
    account: renderAccount,
  }

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    },
    onClick: onClose,
  },
    React.createElement('div', {
      style: {
        backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
        width: '680px', maxHeight: '80vh', display: 'flex',
        flexDirection: 'column' as const, animation: 'fadeIn 0.15s ease-out',
        overflow: 'hidden',
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
      // Header
      React.createElement('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border-default)',
        },
      },
        React.createElement('h3', {
          style: { margin: 0, color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 600 },
        }, 'Settings'),
        React.createElement('button', {
          onClick: onClose,
          style: {
            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '18px', lineHeight: '1', transition: 'color 100ms',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-primary)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-secondary)' },
        }, React.createElement(X, { size: 18 })),
      ),

      // Body: left nav + content
      React.createElement('div', {
        style: { display: 'flex', flex: 1, overflow: 'hidden' },
      },
        // Left nav
        React.createElement('nav', {
          style: {
            width: '160px', minWidth: '160px', borderRight: '1px solid var(--border-default)',
            display: 'flex', flexDirection: 'column' as const, padding: '8px 0',
          },
        },
          ...SECTIONS.map(section =>
            React.createElement('button', {
              key: section.id,
              onClick: () => setActiveSection(section.id),
              style: {
                display: 'block', width: '100%', padding: '8px 16px', height: '36px',
                background: activeSection === section.id ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                borderLeft: activeSection === section.id ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeSection === section.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', textAlign: 'left' as const,
                cursor: 'pointer', transition: 'all 100ms',
              },
              onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                if (activeSection !== section.id) e.currentTarget.style.background = 'var(--bg-hover)'
              },
              onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                if (activeSection !== section.id) e.currentTarget.style.background = 'transparent'
              },
            }, section.label)
          ),
        ),

        // Content
        React.createElement('div', {
          style: { flex: 1, padding: '20px', overflowY: 'auto' as const },
        },
          sectionRenderers[activeSection](),
        ),
      ),
    )
  )
}

export default SettingsModal
