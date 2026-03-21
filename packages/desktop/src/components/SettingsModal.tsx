import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/index'
import { Theme, applyTheme } from '../styles/themes'

type Section = 'general' | 'agents' | 'integrations' | 'repository' | 'interface' | 'account'

const CLI_AGENTS = [
  { id: 'claude', name: 'Claude Code', icon: '\u2733', installCmd: 'npm install -g @anthropic-ai/claude-code', docs: 'https://docs.anthropic.com/claude-code' },
  { id: 'codex', name: 'Codex', icon: '\u25CE', installCmd: 'npm install -g @openai/codex', docs: 'https://github.com/openai/codex' },
  { id: 'gemini', name: 'Gemini CLI', icon: '\u25C8', installCmd: 'npm install -g @google/gemini-cli', docs: 'https://github.com/google-gemini/gemini-cli' },
  { id: 'opencode', name: 'OpenCode', icon: '\u2B21', installCmd: 'npm install -g opencode-ai', docs: 'https://opencode.ai' },
  { id: 'amp', name: 'Amp', icon: '\u26A1', installCmd: '', docs: 'https://ampcode.com' },
  { id: 'cursor', name: 'Cursor', icon: '\u25FB', installCmd: '', docs: 'https://cursor.com' },
  { id: 'cline', name: 'Cline', icon: '\u25D1', installCmd: 'npm install -g cline', docs: 'https://github.com/cline/cline' },
  { id: 'continue', name: 'Continue', icon: '\u25B7', installCmd: '', docs: 'https://continue.dev' },
  { id: 'aider', name: 'Aider', icon: '\u25E7', installCmd: 'pip install aider-chat', docs: 'https://aider.chat' },
]

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'agents', label: 'Agents' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'repository', label: 'Repository' },
  { id: 'interface', label: 'Interface' },
  { id: 'account', label: 'Account' },
]

const INTEGRATIONS = [
  { id: 'github', name: 'GitHub', connected: false },
  { id: 'linear', name: 'Linear', connected: false },
  { id: 'jira', name: 'Jira', connected: false },
  { id: 'gitlab', name: 'GitLab', connected: false },
  { id: 'asana', name: 'Asana', connected: false },
  { id: 'notion', name: 'Notion', connected: false, badge: 'via MCP' },
]

const SettingsModal: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('general')
  const activeProject = useStore(s => s.getActiveProject())

  const onClose = useCallback(() => {
    useStore.getState().closeSettings()
  }, [])

  // General settings
  const [openCommand, setOpenCommand] = useState('claude')
  const [refreshInterval, setRefreshInterval] = useState(3000)
  const defaultModel = useStore(s => s.defaultModel)
  const defaultMode = useStore(s => s.defaultMode)
  const [autoGenerateTaskNames, setAutoGenerateTaskNames] = useState(false)
  const [createWorktreeByDefault, setCreateWorktreeByDefault] = useState(true)
  const [autoTrustWorktrees, setAutoTrustWorktrees] = useState(true)
  const [autoApproveByDefault, setAutoApproveByDefault] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [soundCues, setSoundCues] = useState(false)

  // GitHub settings
  const [githubToken, setGithubToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; login?: string } | null>(null)
  const [testing, setTesting] = useState(false)

  // CLI agent detection
  const [detectedAgents, setDetectedAgents] = useState<Record<string, boolean>>({})
  const [detecting, setDetecting] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)

  // Repository settings
  const [branchPattern, setBranchPattern] = useState('runnio/{branch}')
  const [autoPush, setAutoPush] = useState(true)
  const [worktreeLocation, setWorktreeLocation] = useState('sibling')

  // Theme
  const theme = useStore(s => s.theme)

  // Load settings on mount
  useEffect(() => {
    window.runnio.settings.readGlobal().then((data) => {
      if (data.openCommand) setOpenCommand(data.openCommand)
      if (data.refreshInterval) setRefreshInterval(data.refreshInterval)
      if (data.githubToken) setGithubToken(data.githubToken)
      if (data.branchPattern) setBranchPattern(data.branchPattern)
      if (data.autoPush !== undefined) setAutoPush(data.autoPush)
      if (data.worktreeLocation) setWorktreeLocation(data.worktreeLocation)
      if (data.notifications !== undefined) setNotifications(data.notifications)
      if (data.soundCues !== undefined) setSoundCues(data.soundCues)
      if (data.autoGenerateTaskNames !== undefined) setAutoGenerateTaskNames(data.autoGenerateTaskNames)
      if (data.createWorktreeByDefault !== undefined) setCreateWorktreeByDefault(data.createWorktreeByDefault)
      if (data.autoTrustWorktrees !== undefined) setAutoTrustWorktrees(data.autoTrustWorktrees)
      if (data.autoApproveByDefault !== undefined) setAutoApproveByDefault(data.autoApproveByDefault)
    })
  }, [])

  // Detect CLI agents
  useEffect(() => {
    if (activeSection === 'agents') {
      setDetecting(true)
      window.runnio.agents.detectAll()
        .then(setDetectedAgents)
        .catch(() => {})
        .finally(() => setDetecting(false))
    }
  }, [activeSection])

  const handleSave = async () => {
    await window.runnio.settings.writeGlobal({
      openCommand,
      refreshInterval,
      githubToken: githubToken || undefined,
      branchPattern,
      autoPush,
      worktreeLocation,
      notifications,
      soundCues,
      autoGenerateTaskNames,
      createWorktreeByDefault,
      autoTrustWorktrees,
      autoApproveByDefault,
    })
    useStore.getState().showToast('Settings saved', 'success')
  }

  const handleTestGithub = async () => {
    if (!githubToken.trim()) return
    setTesting(true)
    setTestResult(null)
    const result = await window.runnio.settings.testGithub(githubToken)
    setTestResult(result)
    setTesting(false)
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

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px', background: 'var(--accent)', border: 'none',
    borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)',
    transition: 'opacity 150ms',
  }

  // Branch pattern preview
  const branchPreview = branchPattern
    .replace('{branch}', 'my-feature')
    .replace('{date}', '2026-03-20')
    .replace('{user}', 'dev')

  // ── Section renders ──

  const renderGeneral = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    },
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Open command'),
        React.createElement('input', {
          type: 'text', value: openCommand,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setOpenCommand(e.target.value),
          style: { ...inputStyle, fontFamily: 'Consolas, monospace' },
        }),
        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: '10px', marginTop: '4px' },
        }, 'Command run in terminal when agent starts'),
      ),
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Default model'),
        React.createElement('select', {
          value: defaultModel,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => useStore.getState().setDefaultModel(e.target.value),
          style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
        },
          React.createElement('option', { value: 'claude-opus-4-5' }, 'Claude Opus 4.5'),
          React.createElement('option', { value: 'claude-sonnet-4-5' }, 'Claude Sonnet 4.5'),
          React.createElement('option', { value: 'claude-haiku-4-5' }, 'Claude Haiku 4.5'),
        ),
      ),
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
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Refresh interval: ' + refreshInterval + 'ms'),
        React.createElement('input', {
          type: 'range', min: 1000, max: 10000, step: 500,
          value: refreshInterval,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setRefreshInterval(Number(e.target.value)),
          style: { width: '100%', accentColor: 'var(--accent)' },
        }),
      ),
      React.createElement('div', { style: sectionHeaderStyle }, 'Preferences'),
      toggleRow('Auto-generate task names', autoGenerateTaskNames, setAutoGenerateTaskNames),
      toggleRow('Create worktree by default', createWorktreeByDefault, setCreateWorktreeByDefault),
      toggleRow('Auto-trust worktree directories', autoTrustWorktrees, setAutoTrustWorktrees),
      toggleRow('Auto-approve by default', autoApproveByDefault, setAutoApproveByDefault, 'Enables --dangerously-skip-permissions'),
      toggleRow('Notifications', notifications, setNotifications),
      toggleRow('Sound cues', soundCues, setSoundCues),
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' },
      },
        React.createElement('button', {
          onClick: handleSave,
          style: btnStyle,
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
        }, 'Save'),
      ),
    )

  const renderAgents = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    },
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Default agent'),
        React.createElement('select', {
          value: 'claude',
          style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
        },
          React.createElement('option', { value: 'claude' }, 'Claude Code'),
          React.createElement('option', { value: 'codex' }, 'Codex'),
          React.createElement('option', { value: 'gemini' }, 'Gemini CLI'),
        ),
      ),
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
                  style: { fontSize: '16px', width: '24px', textAlign: 'center' as const },
                }, agent.icon),
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
                      },
                    }, copiedCmd === agent.id ? 'Copied!' : 'Copy install')
                  : null,
              )
            }),
          ),
    )

  const renderIntegrations = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    },
      ...INTEGRATIONS.map(integration => {
        const isGithub = integration.id === 'github'
        const connected = isGithub && !!githubToken && testResult?.success
        return React.createElement('div', {
          key: integration.id,
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
            }, integration.name),
            integration.badge
              ? React.createElement('span', {
                  style: {
                    fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                    color: 'var(--text-tertiary)',
                  },
                }, integration.badge)
              : null,
          ),
          connected
            ? React.createElement('div', {
                style: { display: 'flex', alignItems: 'center', gap: '8px' },
              },
                React.createElement('span', {
                  style: { fontSize: '11px', color: 'var(--working)' },
                }, '\u2713 Connected' + (testResult?.login ? ' as @' + testResult.login : '')),
                React.createElement('button', {
                  onClick: () => { setGithubToken(''); setTestResult(null) },
                  style: {
                    padding: '4px 8px', background: 'transparent',
                    border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '10px',
                  },
                }, 'Disconnect'),
              )
            : React.createElement('button', {
                onClick: isGithub ? () => setActiveSection('account') : undefined,
                style: {
                  padding: '4px 12px', background: 'transparent',
                  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)',
                  transition: 'all 100ms',
                },
                onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' },
                onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' },
              }, '+ Connect'),
        )
      }),
    )

  const renderRepository = () =>
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
    },
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Branch name pattern'),
        React.createElement('input', {
          type: 'text', value: branchPattern,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setBranchPattern(e.target.value),
          style: { ...inputStyle, fontFamily: 'Consolas, monospace' },
        }),
        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: '10px', marginTop: '4px' },
        }, 'Variables: {branch}, {date}, {user}'),
        React.createElement('div', {
          style: { color: 'var(--text-tertiary)', fontSize: '11px', marginTop: '4px', fontFamily: 'Consolas, monospace' },
        }, 'Preview: ' + branchPreview),
      ),
      toggleRow('Auto-push to origin', autoPush, setAutoPush),
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Default worktree location'),
        React.createElement('select', {
          value: worktreeLocation,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setWorktreeLocation(e.target.value),
          style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
        },
          React.createElement('option', { value: 'sibling' }, 'Sibling directory'),
          React.createElement('option', { value: 'inside' }, 'Inside project'),
        ),
      ),
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' },
      },
        React.createElement('button', {
          onClick: handleSave,
          style: btnStyle,
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
        }, 'Save'),
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
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Terminal font'),
        React.createElement('select', {
          style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
        },
          React.createElement('option', { value: 'Consolas' }, 'Consolas (default)'),
          React.createElement('option', { value: 'Cascadia Code' }, 'Cascadia Code'),
          React.createElement('option', { value: 'JetBrains Mono' }, 'JetBrains Mono'),
          React.createElement('option', { value: 'Fira Code' }, 'Fira Code'),
        ),
      ),
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'Terminal font size'),
        React.createElement('select', {
          style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const },
        },
          React.createElement('option', { value: '12' }, '12px'),
          React.createElement('option', { value: '13', selected: true }, 'Default (13px)'),
          React.createElement('option', { value: '14' }, '14px'),
          React.createElement('option', { value: '15' }, '15px'),
          React.createElement('option', { value: '16' }, '16px'),
        ),
      ),
      React.createElement('div', { style: sectionHeaderStyle }, 'Keyboard Shortcuts'),
      React.createElement('div', {
        style: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
      },
        ...[
          ['Ctrl+Shift+P', 'Add project'],
          ['Ctrl+N', 'New agent'],
          ['Ctrl+K', 'Command palette'],
          ['Ctrl+Space', 'Quick prompt'],
          ['Ctrl+B', 'Toggle context panel'],
          ['Ctrl+,', 'Settings'],
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
      // Runnio account placeholder
      React.createElement('div', {
        style: {
          padding: '16px', background: 'var(--bg-app)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
          textAlign: 'center' as const,
        },
      },
        React.createElement('div', {
          style: { color: 'var(--text-primary)', fontSize: 'var(--text-md)', fontWeight: 500, marginBottom: '6px' },
        }, 'Runnio Account'),
        React.createElement('div', {
          style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: '12px' },
        }, 'Sign in to sync settings and access team features.'),
        React.createElement('button', {
          style: {
            padding: '8px 20px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            transition: 'all 100ms',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--accent)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--border-default)' },
        }, 'Sign in with GitHub'),
      ),
      // GitHub Token
      React.createElement('div', {
        style: { borderTop: '1px solid var(--border-default)', paddingTop: '16px' },
      },
        React.createElement('div', { style: sectionHeaderStyle }, 'GitHub Token'),
        React.createElement('div', {
          style: { display: 'flex', gap: '8px', marginBottom: '8px' },
        },
          React.createElement('input', {
            type: showToken ? 'text' : 'password', value: githubToken,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setGithubToken(e.target.value),
            placeholder: 'ghp_...',
            style: { ...inputStyle, flex: 1, fontFamily: 'Consolas, monospace' },
          }),
          React.createElement('button', {
            onClick: () => setShowToken(!showToken),
            style: {
              padding: '8px 12px', background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer',
              fontSize: 'var(--text-sm)',
            },
          }, showToken ? 'Hide' : 'Show'),
          React.createElement('button', {
            onClick: handleTestGithub,
            disabled: testing || !githubToken.trim(),
            style: {
              padding: '8px 12px', background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer',
              fontSize: 'var(--text-sm)', opacity: testing || !githubToken.trim() ? 0.5 : 1,
            },
          }, testing ? '...' : 'Test'),
        ),
        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: '10px', marginBottom: '8px' },
        }, 'Required scopes: repo, pull_requests'),
        testResult
          ? React.createElement('div', {
              style: {
                padding: '10px', borderRadius: 'var(--radius-md)',
                background: testResult.success ? '#0d1a0d' : '#1a0d0d',
                border: '1px solid ' + (testResult.success ? 'var(--working)' : 'var(--error)'),
                color: testResult.success ? 'var(--working)' : 'var(--error)',
                fontSize: 'var(--text-sm)', marginBottom: '8px',
              },
            }, testResult.success ? '\u2713 Connected as @' + (testResult.login || '') : '\u2717 Authentication failed')
          : null,
        React.createElement('div', {
          style: { display: 'flex', justifyContent: 'flex-end' },
        },
          React.createElement('button', {
            onClick: handleSave,
            style: btnStyle,
            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
            onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
          }, 'Save'),
        ),
      ),
      // Developer mode
      React.createElement('div', {
        style: { borderTop: '1px solid var(--border-default)', paddingTop: '16px' },
      },
        React.createElement('div', { style: sectionHeaderStyle }, 'Developer Mode'),
        React.createElement('div', {
          style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' },
        }, process.env.RUNNIO_DEV === 'true'
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
        }, '\u00D7'),
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
