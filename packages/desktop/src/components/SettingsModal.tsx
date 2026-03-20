import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/index'

type Tab = 'general' | 'github' | 'config'

const SettingsModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const activeProject = useStore(s => s.getActiveProject())

  const onClose = useCallback(() => {
    useStore.getState().closeSettings()
  }, [])

  // General settings
  const [openCommand, setOpenCommand] = useState('claude')
  const [refreshInterval, setRefreshInterval] = useState(3000)

  // GitHub settings
  const [githubToken, setGithubToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; login?: string } | null>(null)
  const [testing, setTesting] = useState(false)

  // Project config
  const [projectConfig, setProjectConfig] = useState('')
  const [configSaving, setConfigSaving] = useState(false)

  // Load settings on mount
  useEffect(() => {
    window.runnio.settings.readGlobal().then((data) => {
      if (data.openCommand) setOpenCommand(data.openCommand)
      if (data.refreshInterval) setRefreshInterval(data.refreshInterval)
      if (data.githubToken) setGithubToken(data.githubToken)
    })

    if (activeProject) {
      window.runnio.settings.readProject(activeProject.rootPath).then((data) => {
        setProjectConfig(JSON.stringify(data, null, 2))
      })
    }
  }, [activeProject?.rootPath])

  const handleSaveGeneral = async () => {
    await window.runnio.settings.writeGlobal({
      openCommand,
      refreshInterval,
      githubToken: githubToken || undefined,
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

  const handleSaveConfig = async () => {
    if (!activeProject) return
    setConfigSaving(true)
    try {
      const parsed = JSON.parse(projectConfig)
      await window.runnio.settings.writeProject(activeProject.rootPath, parsed)
      useStore.getState().showToast('Project config saved', 'success')
    } catch {
      useStore.getState().showToast('Invalid JSON', 'warning')
    }
    setConfigSaving(false)
  }

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: '8px 16px', background: activeTab === tab ? 'var(--bg-selected)' : 'transparent',
    border: 'none', borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 'var(--text-sm)', transition: 'all 150ms',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: '#0a0a0a', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--text-base)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px',
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
        width: '520px', maxHeight: '80vh', display: 'flex',
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

      // Tabs
      React.createElement('div', {
        style: { display: 'flex', borderBottom: '1px solid var(--border-default)' },
      },
        React.createElement('button', { onClick: () => setActiveTab('general'), style: tabStyle('general') }, 'General'),
        React.createElement('button', { onClick: () => setActiveTab('github'), style: tabStyle('github') }, 'GitHub'),
        activeProject
          ? React.createElement('button', { onClick: () => setActiveTab('config'), style: tabStyle('config') }, 'Config')
          : null,
      ),

      // Content
      React.createElement('div', {
        style: { padding: '20px', overflowY: 'auto' as const, flex: 1 },
      },
        // General tab
        activeTab === 'general'
          ? React.createElement('div', {
              style: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
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
                }, 'Command run in terminal when agent starts (e.g. claude, claude --dangerously-skip-permissions)'),
              ),
              React.createElement('div', null,
                React.createElement('label', { style: labelStyle }, `Refresh interval: ${refreshInterval}ms`),
                React.createElement('input', {
                  type: 'range', min: 1000, max: 10000, step: 500,
                  value: refreshInterval,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => setRefreshInterval(Number(e.target.value)),
                  style: { width: '100%', accentColor: 'var(--accent)' },
                }),
              ),
              React.createElement('div', {
                style: { display: 'flex', justifyContent: 'flex-end' },
              },
                React.createElement('button', {
                  onClick: handleSaveGeneral,
                  style: {
                    padding: '8px 16px', background: 'var(--accent)', border: 'none',
                    borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)',
                    transition: 'opacity 150ms',
                  },
                  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
                  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
                }, 'Save'),
              ),
            )
          : null,

        // GitHub tab
        activeTab === 'github'
          ? React.createElement('div', {
              style: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
            },
              React.createElement('div', null,
                React.createElement('label', { style: labelStyle }, 'Personal access token'),
                React.createElement('div', {
                  style: { display: 'flex', gap: '8px' },
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
                  style: { color: 'var(--text-disabled)', fontSize: '10px', marginTop: '4px' },
                }, 'Required scopes: repo, pull_requests'),
              ),
              testResult
                ? React.createElement('div', {
                    style: {
                      padding: '12px', borderRadius: 'var(--radius-md)',
                      background: testResult.success ? '#0d1a0d' : '#1a0d0d',
                      border: `1px solid ${testResult.success ? 'var(--working)' : 'var(--error)'}`,
                      color: testResult.success ? 'var(--working)' : 'var(--error)',
                      fontSize: 'var(--text-sm)',
                    },
                  }, testResult.success ? `\u2713 Connected as @${testResult.login}` : '\u2717 Authentication failed')
                : null,
              React.createElement('div', {
                style: { display: 'flex', justifyContent: 'flex-end' },
              },
                React.createElement('button', {
                  onClick: handleSaveGeneral,
                  style: {
                    padding: '8px 16px', background: 'var(--accent)', border: 'none',
                    borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)',
                    transition: 'opacity 150ms',
                  },
                  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
                  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
                }, 'Save'),
              ),
            )
          : null,

        // Config tab
        activeTab === 'config' && activeProject
          ? React.createElement('div', {
              style: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
            },
              React.createElement('div', {
                style: { color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' },
              }, `runnio.config.json \u2014 ${activeProject.name}`),
              React.createElement('textarea', {
                value: projectConfig,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectConfig(e.target.value),
                rows: 10,
                style: {
                  ...inputStyle, fontFamily: 'Consolas, monospace', fontSize: 'var(--text-sm)',
                  resize: 'vertical' as const, lineHeight: '1.5',
                },
              }),
              React.createElement('div', {
                style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
              },
                React.createElement('button', {
                  onClick: () => setProjectConfig('{\n  \n}'),
                  style: {
                    padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                  },
                }, 'Reset'),
                React.createElement('button', {
                  onClick: handleSaveConfig,
                  disabled: configSaving,
                  style: {
                    padding: '8px 16px', background: 'var(--accent)', border: 'none',
                    borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)',
                    opacity: configSaving ? 0.5 : 1, transition: 'opacity 150ms',
                  },
                }, configSaving ? 'Saving...' : 'Save'),
              ),
            )
          : null,
      ),
    )
  )
}

export default SettingsModal
