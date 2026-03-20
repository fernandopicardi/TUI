import * as React from 'react'
import { useState, useEffect } from 'react'
import { useStore } from '../store/index'

interface Props {
  worktreePath: string
  branch: string
}

type Step = 'files' | 'form' | 'done'

const PRPanel: React.FC<Props> = ({ worktreePath, branch }) => {
  const [files, setFiles] = useState<string[]>([])
  const [step, setStep] = useState<Step>('files')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [baseBranch, setBaseBranch] = useState('main')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [prNumber, setPrNumber] = useState<number | null>(null)
  const [hasToken, setHasToken] = useState<boolean | null>(null)

  // Inline token input
  const [tokenInput, setTokenInput] = useState('')
  const [savingToken, setSavingToken] = useState(false)
  const [tokenTestResult, setTokenTestResult] = useState<{ success: boolean; login?: string } | null>(null)

  useEffect(() => {
    if (!window.agentflow?.github) return
    window.agentflow.github.getDiff(worktreePath)
      .then((result) => setFiles(result?.files || []))
      .catch(() => {})

    checkToken()
  }, [worktreePath])

  const checkToken = () => {
    window.agentflow.settings.readGlobal()
      .then((cfg) => setHasToken(!!(cfg as any).githubToken))
      .catch(() => setHasToken(false))
  }

  useEffect(() => {
    if (!title) {
      const parts = branch.split('/')
      setTitle(parts[parts.length - 1]?.replace(/-/g, ' ') || branch)
    }
  }, [branch])

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return
    setSavingToken(true)
    setTokenTestResult(null)

    // Test the token first
    const testResult = await window.agentflow.settings.testGithub(tokenInput.trim())
    setTokenTestResult(testResult)

    if (testResult.success) {
      // Save token to global settings (~/.agentflow/config.json), not project config
      const currentGlobal = await window.agentflow.settings.readGlobal()
      await window.agentflow.settings.writeGlobal({
        ...currentGlobal,
        githubToken: tokenInput.trim(),
      })
      setHasToken(true)
      useStore.getState().showToast(`GitHub connected as @${testResult.login}`, 'success')
    }
    setSavingToken(false)
  }

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.agentflow.github.createPR({
        worktreePath, title, description, baseBranch, branch,
      })
      if (result.success) {
        setPrUrl(result.url || null)
        setPrNumber(result.number || null)
        setStep('done')
        useStore.getState().showToast(`PR #${result.number} created`, 'success')
      } else {
        if (result.error === 'no_token') {
          setHasToken(false)
          setError('Token not found. Please add your GitHub token below.')
        } else if (result.error === 'no_remote') {
          setError('No remote "origin" configured.')
        } else if (result.error === 'not_github') {
          setError('Remote is not a GitHub repository.')
        } else {
          setError(result.error || 'Failed to create PR')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: '#0a0a0a', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--text-base)',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  const getFileStatus = (f: string) => {
    if (f.endsWith('.new') || !files.includes(f)) return { badge: 'A', color: 'var(--working)' }
    return { badge: 'M', color: 'var(--waiting)' }
  }

  // No token — show inline token setup
  if (hasToken === false) {
    return React.createElement('div', {
      style: { padding: '24px', maxWidth: '560px' },
    },
      React.createElement('h3', {
        style: { margin: '0 0 16px', color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 600 },
      }, 'Pull Request'),

      React.createElement('div', {
        style: {
          padding: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
        },
      },
        React.createElement('div', {
          style: { color: 'var(--text-primary)', fontSize: 'var(--text-md)', fontWeight: 500, marginBottom: '4px' },
        }, 'Connect GitHub'),
        React.createElement('div', {
          style: { color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: '1.5' },
        }, 'Paste your personal access token to create pull requests directly from agentflow.'),

        // Token input
        React.createElement('div', {
          style: { display: 'flex', gap: '8px', marginBottom: '8px' },
        },
          React.createElement('input', {
            type: 'password',
            value: tokenInput,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setTokenInput(e.target.value); setTokenTestResult(null) },
            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSaveToken() },
            placeholder: 'ghp_...',
            autoFocus: true,
            style: { ...inputStyle, flex: 1, fontFamily: 'Consolas, monospace' },
          }),
          React.createElement('button', {
            onClick: handleSaveToken,
            disabled: savingToken || !tokenInput.trim(),
            style: {
              padding: '8px 16px', background: 'var(--accent)', border: 'none',
              borderRadius: 'var(--radius-md)', color: '#fff', cursor: savingToken ? 'not-allowed' : 'pointer',
              fontSize: 'var(--text-sm)', opacity: savingToken || !tokenInput.trim() ? 0.5 : 1,
              transition: 'opacity 150ms', whiteSpace: 'nowrap' as const,
            },
          }, savingToken ? 'Testing...' : 'Save & Connect'),
        ),

        // Test result
        tokenTestResult
          ? React.createElement('div', {
              style: {
                padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: '8px',
                background: tokenTestResult.success ? '#0d1a0d' : '#1a0d0d',
                border: `1px solid ${tokenTestResult.success ? 'var(--working)' : 'var(--error)'}`,
                color: tokenTestResult.success ? 'var(--working)' : 'var(--error)',
                fontSize: 'var(--text-sm)',
              },
            }, tokenTestResult.success ? `\u2713 Connected as @${tokenTestResult.login}` : '\u2717 Invalid token. Check scopes and try again.')
          : null,

        React.createElement('div', {
          style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', lineHeight: '1.5' },
        }, 'Required scopes: repo. Token is saved to agentflow.config.json in your project.'),
      ),
    )
  }

  // Done state
  if (step === 'done' && prUrl) {
    return React.createElement('div', {
      style: { padding: '24px', maxWidth: '560px' },
    },
      React.createElement('div', {
        style: {
          padding: '24px', background: '#0d1a0d', border: '1px solid var(--working)',
          borderRadius: 'var(--radius-lg)', textAlign: 'center' as const,
        },
      },
        React.createElement('div', {
          style: { color: 'var(--working)', fontSize: '24px', marginBottom: '8px' },
        }, '\u2713'),
        React.createElement('div', {
          style: { color: 'var(--text-primary)', fontSize: 'var(--text-md)', fontWeight: 500, marginBottom: '12px' },
        }, `PR #${prNumber} created`),
        React.createElement('div', {
          style: { color: 'var(--accent)', fontSize: 'var(--text-sm)', marginBottom: '16px', wordBreak: 'break-all' as const },
        }, prUrl),
        React.createElement('button', {
          onClick: () => setStep('files'),
          style: {
            padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          },
        }, 'Back to files'),
      )
    )
  }

  return React.createElement('div', {
    style: { padding: '24px', maxWidth: '560px' },
  },
    React.createElement('h3', {
      style: { margin: '0 0 16px', color: 'var(--text-primary)', fontSize: 'var(--text-lg)', fontWeight: 600 },
    }, 'Pull Request'),

    // Files list
    files.length > 0
      ? React.createElement('div', { style: { marginBottom: '20px' } },
          React.createElement('p', {
            style: { color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '8px' },
          }, `${files.length} file(s) changed:`),
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' as const, gap: '4px', maxHeight: '120px', overflow: 'auto' },
          },
            ...files.map((f) => {
              const st = getFileStatus(f)
              return React.createElement('div', {
                key: f,
                style: {
                  padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: 'Consolas, monospace',
                  border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '8px',
                },
              },
                React.createElement('span', {
                  style: { fontSize: '10px', fontWeight: 600, color: st.color, minWidth: '14px' },
                }, st.badge),
                f,
              )
            })
          )
        )
      : React.createElement('div', {
          style: {
            padding: '24px', textAlign: 'center' as const, color: 'var(--text-tertiary)',
            fontSize: 'var(--text-base)',
          },
        },
          React.createElement('div', { style: { fontSize: '20px', marginBottom: '8px' } }, '\u2713'),
          'No changes in this workspace',
          React.createElement('div', { style: { fontSize: 'var(--text-xs)', marginTop: '4px', color: 'var(--text-disabled)' } }, 'All files are up to date'),
        ),

    // Create PR button
    step === 'files' && files.length > 0
      ? React.createElement('div', null,
          React.createElement('button', {
            onClick: () => setStep('form'),
            style: {
              padding: '8px 16px', background: 'var(--accent)', border: 'none',
              borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', fontSize: 'var(--text-sm)',
              transition: 'opacity 150ms',
            },
            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
            onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
          }, 'Create Pull Request \u2192')
        )
      : null,

    // Form
    step === 'form'
      ? React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
        },
          React.createElement('div', null,
            React.createElement('label', { style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' } }, 'Title'),
            React.createElement('input', {
              type: 'text', value: title,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value),
              style: inputStyle,
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' } }, 'Description'),
            React.createElement('textarea', {
              value: description,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value),
              rows: 4,
              placeholder: 'Describe the changes...',
              style: { ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' },
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { style: { color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', display: 'block', marginBottom: '4px' } }, 'Base branch'),
            React.createElement('input', {
              type: 'text', value: baseBranch,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setBaseBranch(e.target.value),
              style: inputStyle,
            })
          ),
          error
            ? React.createElement('p', { style: { color: 'var(--error)', fontSize: 'var(--text-sm)', margin: 0 } }, error)
            : null,
          React.createElement('div', {
            style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
          },
            React.createElement('button', {
              onClick: () => setStep('files'),
              style: {
                padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
              },
            }, 'Back'),
            React.createElement('button', {
              onClick: handleCreate,
              disabled: loading || !title.trim(),
              style: {
                padding: '8px 16px', background: 'var(--accent)', border: 'none',
                borderRadius: 'var(--radius-md)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 'var(--text-sm)', opacity: loading || !title.trim() ? 0.5 : 1,
                transition: 'opacity 150ms',
              },
            }, loading ? 'Creating...' : 'Create PR'),
          ),
        )
      : null,
  )
}

export default PRPanel
