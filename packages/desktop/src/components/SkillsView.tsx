// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { useState, useEffect } from 'react'

const SKILL_REGISTRY = [
  { id: 'bmad', name: 'BMAD Workflow', description: 'Agile AI-driven development framework', source: 'Anthropic ecosystem', installCmd: 'npx bmad-method install' },
  { id: 'code-review', name: 'Code Review', description: 'Automated code review with best practices', source: 'Community', installCmd: '' },
  { id: 'context7', name: 'Context7 Docs', description: 'Fetch live documentation for libraries', source: 'Upstash', installCmd: '' },
  { id: 'commit', name: 'Smart Commit', description: 'Generate conventional commit messages', source: 'Community', installCmd: '' },
  { id: 'test-generator', name: 'Test Generator', description: 'Generate unit tests for your code', source: 'Community', installCmd: '' },
]

interface InstalledSkill {
  name: string
  description: string
  path: string
}

const SkillsView: React.FC = () => {
  const [search, setSearch] = useState('')
  const [installed, setInstalled] = useState<InstalledSkill[]>([])
  const [showInstallModal, setShowInstallModal] = useState<typeof SKILL_REGISTRY[0] | null>(null)
  const [showNewSkillModal, setShowNewSkillModal] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const loadInstalled = () => {
    if (!window.runnio?.tasks?.skillsList) return
    window.runnio.tasks.skillsList()
      .then(result => setInstalled(result.skills))
      .catch(() => {})
  }

  useEffect(() => { loadInstalled() }, [])

  const filteredInstalled = installed.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  const filteredDiscover = SKILL_REGISTRY.filter(s =>
    !installed.some(i => i.name.toLowerCase() === s.id.toLowerCase()) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
     s.description.toLowerCase().includes(search.toLowerCase()))
  )

  const cardStyle = (id: string): React.CSSProperties => ({
    backgroundColor: 'var(--bg-elevated)',
    border: `1px solid ${hoveredCard === id ? 'var(--accent)' : 'var(--border-default)'}`,
    borderRadius: '8px', padding: '14px 16px',
    cursor: 'pointer', transition: 'border-color 100ms',
    minWidth: '220px', flex: '1 1 220px', maxWidth: '320px',
  })

  return React.createElement('div', {
    style: {
      padding: '24px 32px', overflow: 'auto', height: '100%',
      backgroundColor: 'var(--bg-app)',
    },
  },
    // Header
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
    },
      React.createElement('h1', {
        style: { margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' },
      }, 'Skills'),
      React.createElement('button', {
        onClick: () => setShowNewSkillModal(true),
        style: {
          padding: '7px 16px', backgroundColor: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: '6px', fontSize: 'var(--text-sm)',
          cursor: 'pointer', fontWeight: 500,
        },
      }, '+ New Skill'),
    ),

    React.createElement('p', {
      style: { margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' },
    }, 'Extend your agents with reusable skill modules.'),

    // Search bar
    React.createElement('div', {
      style: { display: 'flex', gap: '8px', marginBottom: '20px' },
    },
      React.createElement('input', {
        type: 'text', value: search, placeholder: 'Search and discover skills...',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
        style: {
          flex: 1, padding: '8px 12px',
          backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)',
          border: '1px solid var(--border-default)', borderRadius: '6px',
          fontSize: 'var(--text-sm)', outline: 'none',
        },
      }),
      React.createElement('button', {
        onClick: loadInstalled,
        style: {
          padding: '8px 12px', backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)', borderRadius: '6px',
          color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '14px',
        },
        title: 'Refresh',
      }, '\u21BA'),
    ),

    // Info banner
    React.createElement('div', {
      style: {
        padding: '10px 14px', backgroundColor: 'var(--bg-elevated)',
        borderRadius: '6px', marginBottom: '20px',
        fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
        border: '1px solid var(--border-subtle)',
      },
    }, 'Skills from Anthropic, the community, and your projects.'),

    // Installed section
    React.createElement('h3', {
      style: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    }, `Installed (${filteredInstalled.length})`),

    filteredInstalled.length > 0
      ? React.createElement('div', {
          style: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px', marginBottom: '24px' },
        },
          ...filteredInstalled.map(skill =>
            React.createElement('div', {
              key: skill.name,
              style: cardStyle(`i-${skill.name}`),
              onMouseEnter: () => setHoveredCard(`i-${skill.name}`),
              onMouseLeave: () => setHoveredCard(null),
            },
              React.createElement('div', {
                style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
              },
                React.createElement('span', {
                  style: {
                    fontSize: '10px', fontWeight: 600, color: 'var(--accent)',
                    backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '3px',
                    padding: '1px 5px',
                  },
                }, 'L'),
                React.createElement('span', {
                  style: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' },
                }, skill.name),
              ),
              React.createElement('div', {
                style: { fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.3' },
              }, skill.description),
            )
          ),
        )
      : React.createElement('div', {
          style: { marginBottom: '24px', fontSize: 'var(--text-sm)', color: 'var(--text-disabled)' },
        }, 'No installed skills found.'),

    // Discover section
    React.createElement('h3', {
      style: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    }, 'Discover'),

    React.createElement('div', {
      style: { display: 'flex', flexWrap: 'wrap' as const, gap: '10px' },
    },
      ...filteredDiscover.map(skill =>
        React.createElement('div', {
          key: skill.id,
          style: cardStyle(`d-${skill.id}`),
          onMouseEnter: () => setHoveredCard(`d-${skill.id}`),
          onMouseLeave: () => setHoveredCard(null),
        },
          React.createElement('div', {
            style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
          },
            React.createElement('span', {
              style: {
                fontSize: '10px', fontWeight: 600, color: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: '3px',
                padding: '1px 5px',
              },
            }, 'A'),
            React.createElement('span', {
              style: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' },
            }, skill.name),
          ),
          React.createElement('div', {
            style: { fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.3', marginBottom: '8px' },
          }, skill.description),
          React.createElement('div', {
            style: { fontSize: '11px', color: 'var(--text-disabled)', marginBottom: '6px' },
          }, skill.source),
          React.createElement('button', {
            onClick: (e: React.MouseEvent) => { e.stopPropagation(); setShowInstallModal(skill) },
            style: {
              padding: '4px 12px', backgroundColor: 'transparent',
              border: '1px solid var(--accent)', borderRadius: '4px',
              color: 'var(--accent)', cursor: 'pointer', fontSize: '11px',
              float: 'right' as const,
            },
          }, '+ Add'),
        )
      ),
    ),

    // Install modal
    showInstallModal
      ? React.createElement('div', {
          style: {
            position: 'fixed' as const, inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
          onClick: () => setShowInstallModal(null),
        },
          React.createElement('div', {
            style: {
              width: '400px', backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px', padding: '24px',
              border: '1px solid var(--border-default)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            },
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
            React.createElement('h3', {
              style: { margin: '0 0 12px', fontSize: '16px', color: 'var(--text-primary)' },
            }, `Install ${showInstallModal.name}`),
            React.createElement('p', {
              style: { margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' },
            }, showInstallModal.description),
            showInstallModal.installCmd
              ? React.createElement('div', null,
                  React.createElement('p', {
                    style: { margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)' },
                  }, 'Run this command in your terminal:'),
                  React.createElement('code', {
                    style: {
                      display: 'block', padding: '10px 14px',
                      backgroundColor: 'var(--bg-app)', borderRadius: '6px',
                      fontSize: '13px', color: 'var(--accent)',
                      fontFamily: 'Consolas, monospace',
                      border: '1px solid var(--border-subtle)',
                    },
                  }, showInstallModal.installCmd),
                )
              : React.createElement('p', {
                  style: { fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' },
                }, 'Check the skill documentation for installation instructions.'),
            React.createElement('div', {
              style: { display: 'flex', justifyContent: 'flex-end', marginTop: '16px' },
            },
              React.createElement('button', {
                onClick: () => setShowInstallModal(null),
                style: {
                  padding: '7px 16px', backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)', borderRadius: '6px',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
                },
              }, 'Close'),
            ),
          ),
        )
      : null,

    // New Skill modal
    showNewSkillModal
      ? React.createElement(NewSkillModal, {
          onClose: () => { setShowNewSkillModal(false); loadInstalled() },
        })
      : null,
  )
}

// ── New Skill Modal ──
interface NewSkillModalProps {
  onClose: () => void
}

const NewSkillModal: React.FC<NewSkillModalProps> = ({ onClose }) => {
  const [skillName, setSkillName] = useState('')
  const [skillDesc, setSkillDesc] = useState('')

  const template = `---
description: ${skillDesc || 'Describe what this skill does'}
---

# ${skillName || 'my-skill'}

## Instructions

Add your skill instructions here.
`

  return React.createElement('div', {
    style: {
      position: 'fixed' as const, inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    onClick: onClose,
  },
    React.createElement('div', {
      style: {
        width: '480px', backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px', padding: '24px',
        border: '1px solid var(--border-default)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
      React.createElement('h3', {
        style: { margin: '0 0 16px', fontSize: '16px', color: 'var(--text-primary)' },
      }, 'New Skill'),

      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('label', {
          style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
        }, 'Skill name'),
        React.createElement('input', {
          type: 'text', value: skillName, placeholder: 'my-skill',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSkillName(e.target.value),
          style: {
            width: '100%', padding: '8px 12px', boxSizing: 'border-box' as const,
            backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
            border: '1px solid var(--border-default)', borderRadius: '6px',
            fontSize: 'var(--text-sm)', outline: 'none',
          },
        }),
      ),

      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('label', {
          style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
        }, 'Description'),
        React.createElement('input', {
          type: 'text', value: skillDesc, placeholder: 'What does this skill do?',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSkillDesc(e.target.value),
          style: {
            width: '100%', padding: '8px 12px', boxSizing: 'border-box' as const,
            backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)',
            border: '1px solid var(--border-default)', borderRadius: '6px',
            fontSize: 'var(--text-sm)', outline: 'none',
          },
        }),
      ),

      React.createElement('div', { style: { marginBottom: '12px' } },
        React.createElement('label', {
          style: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '4px' },
        }, 'SKILL.md preview'),
        React.createElement('pre', {
          style: {
            padding: '10px 14px', backgroundColor: 'var(--bg-app)',
            borderRadius: '6px', fontSize: '12px', color: 'var(--text-tertiary)',
            fontFamily: 'Consolas, monospace', border: '1px solid var(--border-subtle)',
            overflow: 'auto', maxHeight: '150px', whiteSpace: 'pre-wrap' as const,
            margin: 0,
          },
        }, template),
      ),

      React.createElement('p', {
        style: { fontSize: '11px', color: 'var(--text-disabled)', margin: '0 0 16px' },
      }, `Will be saved to ~/.claude/skills/${skillName || 'my-skill'}/SKILL.md`),

      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
      },
        React.createElement('button', {
          onClick: onClose,
          style: {
            padding: '7px 16px', backgroundColor: 'transparent',
            border: '1px solid var(--border-default)', borderRadius: '6px',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
          },
        }, 'Cancel'),
        React.createElement('button', {
          onClick: () => {
            // This would write via IPC - for now show instruction
            const name = skillName.trim() || 'my-skill'
            alert(`To create this skill, save the template to:\n~/.claude/skills/${name}/SKILL.md`)
            onClose()
          },
          disabled: !skillName.trim(),
          style: {
            padding: '7px 16px',
            backgroundColor: skillName.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
            border: 'none', borderRadius: '6px',
            color: skillName.trim() ? '#fff' : 'var(--text-disabled)',
            cursor: skillName.trim() ? 'pointer' : 'default',
            fontSize: 'var(--text-sm)', fontWeight: 500,
          },
        }, 'Create'),
      ),
    ),
  )
}

export default SkillsView
