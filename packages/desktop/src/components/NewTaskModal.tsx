// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useStore } from '../store/index'
import type { TaskStatus, TaskSource } from '../types'

interface Props {
  initialStatus?: TaskStatus
  onClose: () => void
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

const NewTaskModal: React.FC<Props> = ({ initialStatus, onClose }) => {
  const projects = useStore(s => s.projects)
  const activeProjectId = useStore(s => s.activeProjectId)

  const [taskName, setTaskName] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchEdited, setBranchEdited] = useState(false)
  const [selectedProject, setSelectedProject] = useState(activeProjectId || projects[0]?.id || '')
  const [provider, setProvider] = useState('claude')
  const [runInWorktree, setRunInWorktree] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [initialPrompt, setInitialPrompt] = useState('')

  // External issue linking
  const [linkedSource, setLinkedSource] = useState<TaskSource | ''>('')
  const [externalId, setExternalId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')

  // GitHub issues
  const [githubIssues, setGithubIssues] = useState<{ id: string; title: string; url: string; number: number }[]>([])
  const [loadingGithub, setLoadingGithub] = useState(false)

  // Auto-generate branch name from task name
  useEffect(() => {
    if (!branchEdited && taskName.trim()) {
      setBranchName('runnio/' + slugify(taskName))
    }
  }, [taskName, branchEdited])

  // Load GitHub issues when project is selected
  useEffect(() => {
    if (!selectedProject) return
    const project = projects.find(p => p.id === selectedProject)
    if (!project || !window.runnio?.tasks) return

    setLoadingGithub(true)
    window.runnio.tasks.githubList(project.rootPath)
      .then(result => {
        if (result.success && result.tasks) setGithubIssues(result.tasks)
      })
      .catch(() => {})
      .finally(() => setLoadingGithub(false))
  }, [selectedProject, projects])

  const handleCreate = () => {
    if (!taskName.trim() || !selectedProject) return

    const store = useStore.getState()
    store.addTask({
      title: taskName.trim(),
      status: initialStatus || 'todo',
      source: (linkedSource as TaskSource) || 'runnio',
      projectId: selectedProject,
      providerId: provider,
      initialPrompt: initialPrompt.trim() || undefined,
      externalId: externalId || undefined,
      externalUrl: externalUrl || undefined,
      isAutomatic: false,
    })

    store.showToast('Task created', 'success')
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', boxSizing: 'border-box' as const,
    backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
    border: '1px solid var(--border-default)', borderRadius: '6px',
    fontSize: 'var(--text-sm)', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500,
    marginBottom: '4px', display: 'block',
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
        width: '480px', maxHeight: '80vh', overflow: 'auto',
        backgroundColor: 'var(--bg-surface)', borderRadius: '12px',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        padding: '24px',
      },
    },
      // Header
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
      },
        React.createElement('h2', {
          style: { margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: 600 },
        }, 'New Task'),
        React.createElement('button', {
          onClick: onClose,
          style: {
            background: 'none', border: 'none', color: 'var(--text-tertiary)',
            cursor: 'pointer', fontSize: '18px', padding: '0',
          },
        }, '\u00D7'),
      ),

      // Task name
      React.createElement('div', { style: { marginBottom: '14px' } },
        React.createElement('label', { style: labelStyle }, 'Task name'),
        React.createElement('input', {
          type: 'text', value: taskName, placeholder: 'Feature: add global terminal',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTaskName(e.target.value),
          style: inputStyle, autoFocus: true,
        }),
      ),

      // Branch name
      React.createElement('div', { style: { marginBottom: '14px' } },
        React.createElement('label', { style: labelStyle }, 'Branch name'),
        React.createElement('input', {
          type: 'text', value: branchName,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setBranchName(e.target.value); setBranchEdited(true) },
          style: { ...inputStyle, fontFamily: 'Consolas, monospace' },
        }),
      ),

      // Project
      projects.length > 1
        ? React.createElement('div', { style: { marginBottom: '14px' } },
            React.createElement('label', { style: labelStyle }, 'Project'),
            React.createElement('select', {
              value: selectedProject,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedProject(e.target.value),
              style: { ...inputStyle, cursor: 'pointer' },
            },
              ...projects.map(p =>
                React.createElement('option', { key: p.id, value: p.id }, p.name)
              ),
            ),
          )
        : null,

      // AI Provider
      React.createElement('div', { style: { marginBottom: '14px' } },
        React.createElement('label', { style: labelStyle }, 'AI Provider'),
        React.createElement('select', {
          value: provider,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setProvider(e.target.value),
          style: { ...inputStyle, cursor: 'pointer' },
        },
          React.createElement('option', { value: 'claude' }, 'Claude Code'),
          React.createElement('option', { value: 'codex' }, 'Codex CLI'),
          React.createElement('option', { value: 'gemini' }, 'Gemini CLI'),
        ),
      ),

      // Advanced options toggle
      React.createElement('button', {
        onClick: () => setShowAdvanced(!showAdvanced),
        style: {
          background: 'none', border: 'none', color: 'var(--text-tertiary)',
          cursor: 'pointer', fontSize: 'var(--text-sm)', padding: '4px 0',
          marginBottom: '10px',
        },
      }, `${showAdvanced ? '\u25BC' : '\u25B6'} Advanced options`),

      showAdvanced
        ? React.createElement('div', { style: { marginBottom: '14px' } },
            // Run in worktree
            React.createElement('label', {
              style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '8px' },
            },
              React.createElement('input', {
                type: 'checkbox', checked: runInWorktree,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setRunInWorktree(e.target.checked),
              }),
              'Run in worktree',
            ),

            // Link to issue — GitHub
            React.createElement('div', { style: { marginTop: '12px' } },
              React.createElement('label', { style: labelStyle }, 'Link to issue'),
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' } },
                React.createElement('span', { style: { fontSize: '12px', color: 'var(--text-tertiary)', width: '60px' } }, 'GitHub'),
                React.createElement('select', {
                  value: linkedSource === 'github' ? externalId : '',
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                    const issue = githubIssues.find(i => i.id === e.target.value)
                    if (issue) {
                      setLinkedSource('github')
                      setExternalId(issue.id)
                      setExternalUrl(issue.url)
                    }
                  },
                  style: { ...inputStyle, flex: 1 },
                },
                  React.createElement('option', { value: '' }, loadingGithub ? 'Loading...' : 'Select a GitHub issue...'),
                  ...githubIssues.map(i =>
                    React.createElement('option', { key: i.id, value: i.id }, `#${i.number} ${i.title}`)
                  ),
                ),
              ),
            ),

            // Initial prompt
            React.createElement('div', { style: { marginTop: '12px' } },
              React.createElement('label', { style: labelStyle }, 'Initial prompt (optional)'),
              React.createElement('textarea', {
                value: initialPrompt, placeholder: 'e.g. Summarize the key problems...',
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInitialPrompt(e.target.value),
                style: { ...inputStyle, minHeight: '60px', resize: 'vertical' as const, fontFamily: 'inherit' },
              }),
            ),
          )
        : null,

      // Actions
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
      },
        React.createElement('button', {
          onClick: onClose,
          style: {
            padding: '8px 18px', backgroundColor: 'transparent',
            border: '1px solid var(--border-default)', borderRadius: '6px',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          },
        }, 'Cancel'),
        React.createElement('button', {
          onClick: handleCreate,
          disabled: !taskName.trim(),
          style: {
            padding: '8px 18px', backgroundColor: taskName.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
            border: 'none', borderRadius: '6px',
            color: taskName.trim() ? '#fff' : 'var(--text-disabled)',
            cursor: taskName.trim() ? 'pointer' : 'default',
            fontSize: 'var(--text-sm)', fontWeight: 500,
          },
        }, 'Create'),
      ),
    ),
  )
}

export default NewTaskModal
