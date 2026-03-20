import * as React from 'react'
import { useState, useCallback } from 'react'
import { useStore } from '../store/index'

function generateProjectId(rootPath: string): string {
  return btoa(rootPath).replace(/[^a-z0-9]/gi, '').slice(0, 12)
}

const AddProjectModal: React.FC = () => {
  const [step, setStep] = useState<'choose' | 'clone' | 'cloning'>('choose')
  const [url, setUrl] = useState('')
  const [targetPath, setTargetPath] = useState(() => {
    try { return localStorage.getItem('agentflow:clone-dir') || '' } catch { return '' }
  })
  const [folderName, setFolderName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cloning, setCloning] = useState(false)

  const onClose = useCallback(() => {
    useStore.getState().closeAddProject()
  }, [])

  const addProjectFromPath = useCallback(async (rootPath: string) => {
    const projectId = generateProjectId(rootPath)
    const name = rootPath.split(/[\\/]/).pop() || 'project'

    // Check if project already exists
    const existing = useStore.getState().getProjectById(projectId)
    if (existing) {
      useStore.getState().setActiveProject(projectId)
      onClose()
      return
    }

    // Load plugin info
    let plugin = 'raw'
    let pluginContext: any = null
    try {
      const result = await window.agentflow.plugins.load(rootPath)
      plugin = result.pluginName
      pluginContext = result.context
    } catch {}

    // Add project
    useStore.getState().addProject({ id: projectId, name, rootPath, plugin, pluginContext })

    // Create initial agent on main branch
    const agentId = `${projectId}-main`
    useStore.getState().addAgent(projectId, {
      id: agentId,
      projectId,
      branch: 'main',
      worktreePath: rootPath,
      status: 'idle',
      terminalId: agentId,
      isTerminalAlive: false,
    })
    useStore.getState().setActiveAgent(agentId)

    useStore.getState().showToast(`Project "${name}" added`, 'success')
    onClose()
  }, [onClose])

  const handleOpenLocal = useCallback(async () => {
    if (!window.agentflow?.dialog) return
    const selectedPath = await window.agentflow.dialog.openDirectory()
    if (!selectedPath) return
    await addProjectFromPath(selectedPath)
  }, [addProjectFromPath])

  const extractRepoName = (repoUrl: string): string => {
    const match = repoUrl.match(/\/([^/]+?)(?:\.git)?$/)
    return match ? match[1] : ''
  }

  const handleUrlBlur = () => {
    if (url && !folderName) setFolderName(extractRepoName(url))
  }

  const handlePickDir = async () => {
    const dir = await window.agentflow.dialog.openDirectory()
    if (dir) {
      setTargetPath(dir)
      try { localStorage.setItem('agentflow:clone-dir', dir) } catch {}
    }
  }

  const handleClone = useCallback(async () => {
    if (!url.trim() || !targetPath.trim() || !folderName.trim()) return
    setCloning(true)
    setStep('cloning')
    setError(null)

    const result = await window.agentflow.git.clone(url.trim(), targetPath.trim(), folderName.trim())

    if (result.success && result.path) {
      window.agentflow.notify('Clone complete', `${folderName} cloned successfully`, 'success')
      await addProjectFromPath(result.path)
    } else {
      setError(result.error || 'Clone failed')
      setStep('clone')
    }
    setCloning(false)
  }, [url, targetPath, folderName, addProjectFromPath])

  const canClone = url.trim() && targetPath.trim() && folderName.trim() && !cloning

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', background: '#0a0a0a',
    border: '1px solid var(--text-disabled)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Consolas, monospace',
  }

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    },
    onClick: onClose,
  },
    React.createElement('div', {
      style: {
        backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: '12px',
        padding: '24px', width: step === 'choose' ? '440px' : '480px',
        display: 'flex', flexDirection: 'column' as const, gap: '16px',
        animation: 'fadeIn 0.15s ease-out',
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
      React.createElement('h3', {
        style: { margin: 0, color: '#ededed', fontSize: '16px', fontWeight: 600 },
      }, step === 'cloning' ? 'Cloning repository...' : step === 'clone' ? 'Clone repository' : 'Add project'),

      // Step: Choose
      step === 'choose'
        ? React.createElement('div', { style: { display: 'flex', gap: '12px' } },
            React.createElement('button', {
              onClick: handleOpenLocal,
              style: {
                flex: 1, padding: '24px 16px', background: '#111', border: '1px solid #1f1f1f',
                borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: '12px', transition: 'all 0.15s',
              },
              onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                (e.currentTarget).style.borderColor = '#5b6af0';
                (e.currentTarget).style.background = '#0d0d1a'
              },
              onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                (e.currentTarget).style.borderColor = '#1f1f1f';
                (e.currentTarget).style.background = '#111'
              },
            },
              React.createElement('span', { style: { fontSize: '24px' } }, '\uD83D\uDCC1'),
              React.createElement('span', { style: { color: '#ededed', fontSize: '13px', fontWeight: 500 } }, 'Local folder'),
              React.createElement('span', { style: { color: '#666', fontSize: '11px' } }, 'Already cloned')
            ),
            React.createElement('button', {
              onClick: () => setStep('clone'),
              style: {
                flex: 1, padding: '24px 16px', background: '#111', border: '1px solid #1f1f1f',
                borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: '12px', transition: 'all 0.15s',
              },
              onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                (e.currentTarget).style.borderColor = '#5b6af0';
                (e.currentTarget).style.background = '#0d0d1a'
              },
              onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                (e.currentTarget).style.borderColor = '#1f1f1f';
                (e.currentTarget).style.background = '#111'
              },
            },
              React.createElement('span', { style: { fontSize: '24px' } }, '\u2B07'),
              React.createElement('span', { style: { color: '#ededed', fontSize: '13px', fontWeight: 500 } }, 'Clone repo'),
              React.createElement('span', { style: { color: '#666', fontSize: '11px' } }, 'Download from GitHub')
            )
          )
        : null,

      // Step: Clone form
      step === 'clone'
        ? React.createElement(React.Fragment, null,
            React.createElement('div', null,
              React.createElement('label', { style: { color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' } }, 'Repository URL'),
              React.createElement('input', {
                style: inputStyle, value: url, autoFocus: true,
                placeholder: 'https://github.com/user/repo.git',
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value),
                onBlur: handleUrlBlur,
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { style: { color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' } }, 'Clone to'),
              React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                React.createElement('input', {
                  style: { ...inputStyle, flex: 1 }, value: targetPath, readOnly: true,
                  placeholder: 'Select directory...',
                }),
                React.createElement('button', {
                  onClick: handlePickDir,
                  style: { padding: '8px 12px', background: '#1f1f1f', border: '1px solid #333', borderRadius: '6px', color: '#ededed', cursor: 'pointer', fontSize: '14px' },
                }, '\uD83D\uDCC1')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { style: { color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' } }, 'Folder name'),
              React.createElement('input', {
                style: inputStyle, value: folderName,
                placeholder: 'auto-detected from URL...',
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFolderName(e.target.value),
                onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleClone() },
              })
            ),
            error ? React.createElement('p', { style: { color: '#ef4444', fontSize: '12px', margin: 0 } }, error) : null,
            React.createElement('div', { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' } },
              React.createElement('button', {
                onClick: () => setStep('choose'),
                style: { padding: '8px 16px', background: 'transparent', border: '1px solid #333', borderRadius: '6px', color: '#888', cursor: 'pointer', fontSize: '13px' },
              }, '\u2190 Back'),
              React.createElement('button', {
                onClick: handleClone, disabled: !canClone,
                style: {
                  padding: '8px 16px', background: '#5b6af0', border: 'none', borderRadius: '6px',
                  color: '#fff', cursor: canClone ? 'pointer' : 'not-allowed', fontSize: '13px',
                  opacity: canClone ? 1 : 0.5,
                },
              }, 'Clone & Open')
            )
          )
        : null,

      // Step: Cloning
      step === 'cloning'
        ? React.createElement('div', { style: { textAlign: 'center' as const, padding: '20px 0' } },
            React.createElement('div', { style: { color: '#888', fontSize: '13px', marginBottom: '12px' } },
              extractRepoName(url) || url),
            React.createElement('div', {
              style: { height: '4px', background: '#1f1f1f', borderRadius: '2px', overflow: 'hidden' },
            },
              React.createElement('div', {
                style: {
                  height: '100%', background: '#5b6af0', borderRadius: '2px',
                  animation: 'cloneProgress 2s ease-in-out infinite', width: '60%',
                },
              })
            ),
            React.createElement('div', { style: { color: '#555', fontSize: '12px', marginTop: '8px' } }, 'Downloading objects...')
          )
        : null
    )
  )
}

export default AddProjectModal
