// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/index'
import { CLI_PROVIDERS, getProviderById, buildLaunchCommand } from '../data/providers'

const GlobalTerminalModal: React.FC = () => {
  const projects = useStore(s => s.projects)
  const onClose = useCallback(() => useStore.getState().closeGlobalTerminalModal(), [])

  // Derive default working directory from first project's parent
  const defaultWorkDir = projects.length > 0
    ? projects[0].rootPath.split(/[\\/]/).slice(0, -1).join('/')
    : ''

  const [workingDir, setWorkingDir] = useState(defaultWorkDir)
  const [discoveredFolders, setDiscoveredFolders] = useState<{ name: string; path: string }[]>([])
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set(projects.map(p => p.rootPath)))
  const [providerId, setProviderId] = useState('claude')
  const [initialPrompt, setInitialPrompt] = useState('')
  const [detectedProviders, setDetectedProviders] = useState<Record<string, boolean>>({})
  const [launching, setLaunching] = useState(false)

  // Detect CLI agents
  useEffect(() => {
    window.runnio.agents.detectAll().then(setDetectedProviders).catch(() => {})
  }, [])

  // Discover folders in working directory
  useEffect(() => {
    if (!workingDir) return
    window.runnio.files.list(workingDir).then(entries => {
      const folders = entries
        .filter(e => e.type === 'directory')
        .map(e => ({ name: e.name, path: e.path }))
      setDiscoveredFolders(folders)
    }).catch(() => setDiscoveredFolders([]))
  }, [workingDir])

  const handleBrowse = async () => {
    const result = await window.runnio.dialog.openDirectory()
    const selectedPath = typeof result === 'string' ? result : result?.path
    if (selectedPath) setWorkingDir(selectedPath)
  }

  const toggleProject = (projectPath: string) => {
    setSelectedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectPath)) next.delete(projectPath)
      else next.add(projectPath)
      return next
    })
  }

  const handleLaunch = async () => {
    setLaunching(true)
    const provider = getProviderById(providerId) || CLI_PROVIDERS[0]
    const terminalId = `global-${Date.now()}`
    const command = buildLaunchCommand(provider)

    // Build context header
    const selectedPaths = Array.from(selectedProjects)
    const contextLines = [
      'You have access to the following projects:',
      ...selectedPaths.map(p => {
        const name = p.split(/[\\/]/).pop() || p
        return `- ${name}: ${p}`
      }),
      '',
      `Working directory: ${workingDir}`,
    ]

    try {
      const result = await window.runnio.terminal.createGlobal({
        workingDir,
        terminalId,
        command,
      })

      if (result.success) {
        // Inject context + prompt when ready
        const fullPrompt = contextLines.join('\n') + (initialPrompt ? '\n\n' + initialPrompt : '')
        await window.runnio.terminal.injectWhenReady(terminalId, fullPrompt)

        // Add as a special agent to the first project
        if (projects.length > 0) {
          const project = projects[0]
          useStore.getState().addAgent(project.id, {
            id: `${project.id}-global-${Date.now()}`,
            projectId: project.id,
            branch: 'global',
            worktreePath: workingDir,
            status: 'working',
            lastActivity: Date.now(),
            terminalId,
            isTerminalAlive: true,
            hasLaunched: true,
            providerId,
            source: 'internal',
            launchConfig: { model: '', mode: 'normal', initialPrompt: fullPrompt },
          })
        }

        useStore.getState().showToast('Global terminal launched', 'success')
        onClose()
      } else {
        useStore.getState().showToast(result.error || 'Failed to launch', 'warning')
      }
    } catch (err: any) {
      useStore.getState().showToast(err.message || 'Failed to launch', 'warning')
    } finally {
      setLaunching(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: 'var(--bg-app)', border: '1px solid var(--border-default)',
    borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'Consolas, monospace',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '6px',
  }

  // Merge project paths with discovered folders for the checklist
  const allFolders = React.useMemo(() => {
    const seen = new Set<string>()
    const result: { name: string; path: string; isProject: boolean }[] = []
    projects.forEach(p => {
      seen.add(p.rootPath)
      result.push({ name: p.name, path: p.rootPath, isProject: true })
    })
    discoveredFolders.forEach(f => {
      if (!seen.has(f.path)) {
        result.push({ name: f.name, path: f.path, isProject: false })
      }
    })
    return result
  }, [projects, discoveredFolders])

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.15s ease-out',
    },
    onClick: (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose() },
  },
    React.createElement('div', {
      style: {
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: '12px', width: '560px', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
      },
    },
      // Header
      React.createElement('div', {
        style: {
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
        },
      },
        React.createElement('div', null,
          React.createElement('div', {
            style: { fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' },
          }, 'Global Terminal'),
          React.createElement('div', {
            style: { fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' },
          }, 'Access multiple projects simultaneously'),
        ),
        React.createElement('button', {
          onClick: onClose,
          style: {
            width: '28px', height: '28px', borderRadius: '6px', background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' },
        }, '\u00D7'),
      ),

      // Content
      React.createElement('div', {
        style: { padding: '20px', overflow: 'auto' as const, flex: 1 },
      },
        // Working directory
        React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: labelStyle }, 'Working directory'),
          React.createElement('div', { style: { display: 'flex', gap: '8px' } },
            React.createElement('input', {
              type: 'text', value: workingDir,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setWorkingDir(e.target.value),
              style: { ...inputStyle, flex: 1 },
            }),
            React.createElement('button', {
              onClick: handleBrowse,
              style: {
                padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
                whiteSpace: 'nowrap' as const,
              },
            }, 'Browse'),
          ),
          React.createElement('div', {
            style: { fontSize: '11px', color: 'var(--text-disabled)', marginTop: '4px' },
          }, 'Parent folder of your projects'),
        ),

        // Projects in scope
        allFolders.length > 0
          ? React.createElement('div', { style: { marginBottom: '16px' } },
              React.createElement('label', { style: labelStyle }, 'Projects in scope'),
              React.createElement('div', {
                style: {
                  background: 'var(--bg-app)', border: '1px solid var(--border-default)',
                  borderRadius: '6px', maxHeight: '180px', overflow: 'auto' as const,
                },
              },
                ...allFolders.map(folder =>
                  React.createElement('label', {
                    key: folder.path,
                    style: {
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 100ms',
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLLabelElement>) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' },
                    onMouseLeave: (e: React.MouseEvent<HTMLLabelElement>) => { (e.currentTarget as HTMLElement).style.background = 'transparent' },
                  },
                    React.createElement('input', {
                      type: 'checkbox',
                      checked: selectedProjects.has(folder.path),
                      onChange: () => toggleProject(folder.path),
                      style: { accentColor: 'var(--accent)' },
                    }),
                    React.createElement('span', {
                      style: { color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'Consolas, monospace', flex: 1 },
                    }, folder.name),
                    React.createElement('span', {
                      style: { color: 'var(--text-disabled)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: '200px' },
                    }, folder.path),
                  ),
                ),
              ),
            )
          : null,

        // Provider selector
        React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: labelStyle }, 'Provider'),
          React.createElement('select', {
            value: providerId,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setProviderId(e.target.value),
            style: { ...inputStyle, cursor: 'pointer', appearance: 'auto' as const, fontFamily: 'inherit' },
          },
            ...CLI_PROVIDERS.map(p =>
              React.createElement('option', {
                key: p.id, value: p.id,
                disabled: detectedProviders[p.id] === false,
              }, `${p.icon} ${p.name}${detectedProviders[p.id] === false ? ' (not detected)' : ''}`)
            ),
          ),
        ),

        // Initial prompt
        React.createElement('div', { style: { marginBottom: '16px' } },
          React.createElement('label', { style: labelStyle }, 'Initial prompt (optional)'),
          React.createElement('textarea', {
            value: initialPrompt,
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInitialPrompt(e.target.value),
            placeholder: 'e.g. Analyze bbv-agency as reference and configure...',
            rows: 3,
            style: {
              ...inputStyle, resize: 'vertical' as const, lineHeight: '1.5',
            },
          }),
        ),
      ),

      // Footer
      React.createElement('div', {
        style: {
          padding: '16px 20px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'flex-end',
        },
      },
        React.createElement('button', {
          onClick: handleLaunch,
          disabled: launching || !workingDir,
          style: {
            padding: '8px 20px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
            cursor: launching ? 'wait' : 'pointer', transition: 'opacity 150ms',
            opacity: launching || !workingDir ? 0.6 : 1,
          },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { if (!launching) e.currentTarget.style.opacity = '0.85' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { if (!launching) e.currentTarget.style.opacity = '1' },
        }, launching ? 'Launching...' : 'Launch Global Terminal'),
      ),
    ),
  )
}

export default GlobalTerminalModal
