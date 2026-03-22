import * as React from 'react'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useStore } from '../store/index'
import { GitCommitData } from '../types'
import { CommitWithLane, assignLanes, getLaneColor, getActiveLanesAt, detectAgentCommit, formatTimeAgo } from '../utils/gitGraph'
import { Search, X, GitBranch, GitMerge, Bot, User, Copy, Check, ExternalLink, RotateCcw } from 'lucide-react'

interface Props {
  worktreePath: string
  visible: boolean
}

interface CommitFileEntry {
  status: string
  path: string
  additions: number
  deletions: number
}

type HistoryMode = 'code' | 'people'

const ROW_HEIGHT = 36
const LANE_WIDTH = 16
const BUFFER_ROWS = 15

// ── Provider colors for agent avatars ──
const AGENT_AVATAR_COLORS: Record<string, string> = {
  claude: '#d97706',
  copilot: '#1f883d',
  cursor: '#7c3aed',
  codeium: '#09b6a2',
  codex: '#10b981',
  default: '#6366f1',
}

function getAgentAvatarColor(commit: GitCommitData): string {
  const body = (commit.body || '').toLowerCase()
  const email = commit.authorEmail.toLowerCase()
  if (body.includes('claude') || email.includes('claude') || email.includes('anthropic')) return AGENT_AVATAR_COLORS.claude
  if (body.includes('copilot') || email.includes('copilot')) return AGENT_AVATAR_COLORS.copilot
  if (body.includes('cursor')) return AGENT_AVATAR_COLORS.cursor
  if (body.includes('codeium')) return AGENT_AVATAR_COLORS.codeium
  if (body.includes('codex') || email.includes('codex')) return AGENT_AVATAR_COLORS.codex
  return AGENT_AVATAR_COLORS.default
}

function getAgentInitial(commit: GitCommitData): string {
  const body = (commit.body || '').toLowerCase()
  const email = commit.authorEmail.toLowerCase()
  if (body.includes('claude') || email.includes('claude') || email.includes('anthropic')) return 'C'
  if (body.includes('copilot') || email.includes('copilot')) return 'GH'
  if (body.includes('cursor')) return 'Cu'
  if (body.includes('codeium')) return 'Cd'
  if (body.includes('codex') || email.includes('codex')) return 'Cx'
  return 'A'
}

function getHumanInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (name[0] || '?').toUpperCase()
}

// ── Avatar component (agent or human) ──
function renderAvatar(
  commit: GitCommitData & { isAgent: boolean },
  avatarCache: Record<string, string>,
  size: number,
): React.ReactElement {
  if (commit.isAgent) {
    const bg = getAgentAvatarColor(commit)
    const initial = getAgentInitial(commit)
    return React.createElement('div', {
      style: {
        width: size, height: size, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: bg, color: '#fff', fontSize: Math.max(size * 0.4, 9) + 'px',
        fontWeight: 700, letterSpacing: '-0.02em',
        border: `1.5px solid ${bg}88`,
      },
      title: 'Agent commit',
    }, initial)
  }

  const avatar = avatarCache[commit.authorEmail]
  if (avatar) {
    return React.createElement('img', {
      src: avatar, width: size, height: size,
      style: { borderRadius: '50%', border: '1px solid var(--border-default)', flexShrink: 0 },
    })
  }

  // Initials fallback
  const initials = getHumanInitials(commit.author)
  const hue = commit.authorEmail.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return React.createElement('div', {
    style: {
      width: size, height: size, borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      background: `hsl(${hue}, 30%, 25%)`, color: `hsl(${hue}, 40%, 70%)`,
      fontSize: Math.max(size * 0.4, 9) + 'px', fontWeight: 600,
      border: '1px solid var(--border-default)',
    },
  }, initials)
}

// ── Avatar group (overlapping, up to 3) ──
function renderAvatarGroup(
  commits: (GitCommitData & { isAgent: boolean })[],
  avatarCache: Record<string, string>,
  size: number,
): React.ReactElement {
  const seen = new Set<string>()
  const unique: typeof commits = []
  for (const c of commits) {
    const key = c.authorEmail.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(c)
    }
    if (unique.length >= 4) break
  }

  const show = unique.slice(0, 3)
  const extra = unique.length > 3 ? unique.length - 3 : 0

  return React.createElement('div', {
    style: { display: 'flex', alignItems: 'center' },
  },
    ...show.map((c, i) =>
      React.createElement('div', {
        key: c.authorEmail + i,
        style: { marginLeft: i === 0 ? 0 : -(size * 0.35) + 'px', zIndex: show.length - i, position: 'relative' as const },
      }, renderAvatar(c, avatarCache, size))
    ),
    extra > 0
      ? React.createElement('span', {
          style: { marginLeft: '4px', fontSize: '10px', color: 'var(--text-disabled)' },
        }, `+${extra}`)
      : null,
  )
}

const GitHistory: React.FC<Props> = ({ worktreePath, visible }) => {
  const [commits, setCommits] = useState<CommitWithLane[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [currentBranch, setCurrentBranch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<HistoryMode>('code')
  const [selectedCommit, setSelectedCommit] = useState<CommitWithLane | null>(null)
  const [commitFiles, setCommitFiles] = useState<CommitFileEntry[]>([])
  const [commitFilesLoading, setCommitFilesLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [branchFilter, setBranchFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'merges' | 'agent' | 'human'>('all')
  const [copiedHash, setCopiedHash] = useState(false)
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({})

  // Virtual scroll
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const allAgents = useStore(s => s.getAllAgents())
  const agentBranches = useMemo(() => {
    const map = new Map<string, typeof allAgents[0]>()
    allAgents.forEach(a => map.set(a.branch, a))
    return map
  }, [allAgents])

  // Set of branch names for agent detection in assignLanes
  const agentBranchSet = useMemo(() => new Set(allAgents.map(a => a.branch)), [allAgents])
  const agentBranchSetRef = useRef(agentBranchSet)
  agentBranchSetRef.current = agentBranchSet

  const fetchLog = useCallback(() => {
    if (!window.runnio?.git?.log) return
    window.runnio.git.log(worktreePath, { maxCount: 500 })
      .then(result => {
        if (result.error) { setError(result.error); return }
        const withLanes = assignLanes(result.commits, agentBranchSetRef.current)
        setCommits(withLanes)
        setBranches(result.branches)
        setCurrentBranch(result.currentBranch)
        setError(null)

        // Cache avatars
        const emails = new Set(result.commits.map(c => c.authorEmail))
        emails.forEach(email => {
          if (!avatarCache[email]) {
            window.runnio.git.getAvatar(email).then(r => {
              if (r.url) setAvatarCache(prev => ({ ...prev, [email]: r.url! }))
            })
          }
        })
      })
      .catch((err: any) => setError(err?.message || String(err) || 'Failed to load git log'))
      .finally(() => setIsLoading(false))
  }, [worktreePath])

  useEffect(() => {
    if (visible) { setIsLoading(true); fetchLog() }
  }, [visible, worktreePath])

  // Poll every 10s while visible
  useEffect(() => {
    if (visible) {
      pollRef.current = setInterval(fetchLog, 10000)
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [visible, fetchLog])

  // Load commit files when selected
  useEffect(() => {
    if (!selectedCommit) { setCommitFiles([]); return }
    setCommitFilesLoading(true)
    window.runnio.git.commitFiles(worktreePath, selectedCommit.hash)
      .then((files: any[]) => {
        // Handle both old format ({ status, path }) and new format ({ status, path, additions, deletions })
        setCommitFiles(files.map(f => ({
          status: f.status || 'M',
          path: f.path || '',
          additions: f.additions ?? -1,
          deletions: f.deletions ?? -1,
        })))
      })
      .catch(() => setCommitFiles([]))
      .finally(() => setCommitFilesLoading(false))
  }, [selectedCommit?.hash, worktreePath])

  // Escape key closes detail panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCommit) {
        setSelectedCommit(null)
      }
    }
    if (selectedCommit) {
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }
  }, [selectedCommit])

  // Resize observer for virtual scroll
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleCopyHash = () => {
    if (!selectedCommit) return
    navigator.clipboard.writeText(selectedCommit.hash).catch(() => {})
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleCheckout = async () => {
    if (!selectedCommit) return
    if (!confirm(`Checkout commit ${selectedCommit.hashShort}? This will change your working directory.`)) return
    const result = await window.runnio.git.checkout(worktreePath, selectedCommit.hash)
    if (result.success) {
      useStore.getState().showToast(`Checked out ${selectedCommit.hashShort}`, 'success')
      fetchLog()
    } else {
      useStore.getState().showToast(result.error || 'Checkout failed', 'warning')
    }
  }

  // Filter commits
  const filteredCommits = useMemo(() => {
    let result = commits
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.message.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.hashShort.includes(q)
      )
    }
    if (branchFilter) {
      result = result.filter(c => c.refs.some(r => r.includes(branchFilter)))
    }
    if (typeFilter === 'merges') {
      result = result.filter(c => c.parents.length > 1)
    } else if (typeFilter === 'agent') {
      result = result.filter(c => c.isAgent)
    } else if (typeFilter === 'human') {
      result = result.filter(c => !c.isAgent)
    }
    return result
  }, [commits, searchQuery, branchFilter, typeFilter])

  // Virtual scroll calculations
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS)
  const endIndex = Math.min(filteredCommits.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_ROWS)
  const totalHeight = filteredCommits.length * ROW_HEIGHT
  const offsetY = startIndex * ROW_HEIGHT

  // Get max lane count for SVG width
  const maxLane = useMemo(() => {
    let max = 0
    commits.forEach(c => {
      max = Math.max(max, c.lane, ...c.mergeFrom)
    })
    return max + 1
  }, [commits])

  const commitLaneMap = useMemo(() => {
    const map = new Map<string, number>()
    commits.forEach(c => map.set(c.hash, c.lane))
    return map
  }, [commits])

  const svgWidth = Math.max(maxLane * LANE_WIDTH + 8, 40)

  // Parse ref labels
  const parseRef = (ref: string) => {
    const cleaned = ref.replace('refs/heads/', '').replace('refs/remotes/', '').replace('refs/tags/', 'tag:')
    const isHead = ref.includes('HEAD')
    const isTag = ref.includes('refs/tags/')
    const isRemote = ref.includes('refs/remotes/')
    return { label: cleaned, isHead, isTag, isRemote }
  }

  // Unique local branches for pills
  const localBranches = useMemo(() => {
    return branches.filter(b => !b.startsWith('remotes/'))
  }, [branches])

  // People mode data — split into agents and humans
  const authorGroups = useMemo(() => {
    const agentGroups = new Map<string, { author: string; email: string; commits: CommitWithLane[]; isAgent: true }>()
    const humanGroups = new Map<string, { author: string; email: string; commits: CommitWithLane[]; isAgent: false }>()

    filteredCommits.forEach(c => {
      const key = c.authorEmail.toLowerCase().trim()
      if (c.isAgent) {
        if (!agentGroups.has(key)) {
          agentGroups.set(key, { author: c.author, email: c.authorEmail, commits: [], isAgent: true })
        }
        agentGroups.get(key)!.commits.push(c)
      } else {
        if (!humanGroups.has(key)) {
          humanGroups.set(key, { author: c.author, email: c.authorEmail, commits: [], isAgent: false })
        }
        humanGroups.get(key)!.commits.push(c)
      }
    })

    return {
      agents: Array.from(agentGroups.values()).sort((a, b) => b.commits.length - a.commits.length),
      humans: Array.from(humanGroups.values()).sort((a, b) => b.commits.length - a.commits.length),
    }
  }, [filteredCommits])

  // File status colors
  const fileStatusColor = (s: string) => {
    if (s === 'M') return 'var(--waiting)'
    if (s === 'A') return 'var(--working)'
    if (s === 'D') return 'var(--error)'
    if (s === 'R') return 'var(--accent)'
    return 'var(--text-tertiary)'
  }

  const fileStatusIcon = (s: string) => {
    if (s === 'A') return '+'
    if (s === 'D') return '-'
    if (s === 'R') return '\u2192'
    return '\u25CF'
  }

  // ── Skeleton loading ──
  if (isLoading && commits.length === 0) {
    return React.createElement('div', { style: { height: '100%', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' } },
      React.createElement('div', { style: { padding: '8px 12px', borderBottom: '1px solid var(--border-default)' } },
        React.createElement('div', { style: { width: '120px', height: '14px', background: 'var(--bg-elevated)', borderRadius: '4px' } }),
      ),
      ...Array.from({ length: 8 }).map((_, i) =>
        React.createElement('div', {
          key: i,
          style: {
            display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', height: ROW_HEIGHT + 'px',
            animation: `pulse 1.5s infinite ${i * 100}ms`,
          },
        },
          React.createElement('div', { style: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-strong)' } }),
          React.createElement('div', { style: { width: '48px', height: '10px', background: 'var(--bg-elevated)', borderRadius: '3px' } }),
          React.createElement('div', { style: { flex: 1, height: '10px', background: 'var(--bg-elevated)', borderRadius: '3px', maxWidth: `${200 + i * 20}px` } }),
          React.createElement('div', { style: { width: '60px', height: '10px', background: 'var(--bg-elevated)', borderRadius: '3px' } }),
          React.createElement('div', { style: { width: '28px', height: '10px', background: 'var(--bg-elevated)', borderRadius: '3px' } }),
        )
      ),
    )
  }

  if (error) {
    return React.createElement('div', {
      style: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' },
    }, `Error: ${error}`)
  }

  // ── Render commit row SVG graph ──
  const renderGraphSvg = (commit: CommitWithLane, index: number) => {
    const cx = commit.lane * LANE_WIDTH + LANE_WIDTH / 2
    const cy = ROW_HEIGHT / 2
    const isHEAD = commit.refs.some(r => r.includes('HEAD'))

    const elements: React.ReactElement[] = []

    // Active lanes — determines which vertical lines to draw
    const activeLanes = getActiveLanesAt(filteredCommits, index)

    // Vertical lines for active lanes
    activeLanes.forEach(lane => {
      const lx = lane * LANE_WIDTH + LANE_WIDTH / 2
      elements.push(
        React.createElement('line', {
          key: `vl-${lane}`,
          x1: lx, y1: 0, x2: lx, y2: ROW_HEIGHT,
          stroke: getLaneColor(lane), strokeWidth: 1.5,
          opacity: lane === commit.lane ? 0.7 : 0.3,
        })
      )
    })

    // Merge curves — from mergeFrom lanes converging TO this commit's dot
    // The curve starts at the top of this row (incoming from the lane above)
    // and ends at the commit dot position (cy)
    commit.mergeFrom.forEach(fromLane => {
      const x1 = fromLane * LANE_WIDTH + LANE_WIDTH / 2
      const x2 = cx
      const midY = cy / 2  // midpoint between 0 and cy
      elements.push(
        React.createElement('path', {
          key: `merge-${fromLane}`,
          d: `M ${x1} 0 C ${x1} ${midY} ${x2} ${midY} ${x2} ${cy}`,
          stroke: getLaneColor(fromLane), strokeWidth: 1.5, fill: 'none', opacity: 0.7,
        })
      )
    })

    // Branch-off curves — from commit dot diverging TOWARD parent lanes below
    // The curve starts at the commit dot position (cy) and ends at the bottom
    // of this row (continuing into the parent's lane below)
    commit.parents.forEach((parentHash, pi) => {
      const parentLane = commitLaneMap.get(parentHash)
      if (parentLane !== undefined && parentLane !== commit.lane && !commit.mergeFrom.includes(parentLane)) {
        const x1 = cx
        const x2 = parentLane * LANE_WIDTH + LANE_WIDTH / 2
        const midY = cy + (ROW_HEIGHT - cy) / 2  // midpoint between cy and ROW_HEIGHT
        elements.push(
          React.createElement('path', {
            key: `branch-${pi}`,
            d: `M ${x1} ${cy} C ${x1} ${midY} ${x2} ${midY} ${x2} ${ROW_HEIGHT}`,
            stroke: commit.laneColor, strokeWidth: 1.5, fill: 'none', opacity: 0.7,
          })
        )
      }
    })

    // Commit node
    if (commit.isAgent) {
      // Diamond for agent commits — filled with lane color
      const s = isHEAD ? 6 : 5
      elements.push(
        React.createElement('polygon', {
          key: 'node',
          points: `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`,
          fill: commit.laneColor, stroke: 'none',
        })
      )
    } else {
      // Circle for human commits — outlined
      const r = isHEAD ? 5.5 : 4.5
      elements.push(
        React.createElement('circle', {
          key: 'node',
          cx, cy, r,
          fill: 'var(--bg-app)', stroke: commit.laneColor,
          strokeWidth: isHEAD ? 2.5 : 2,
        })
      )
    }

    return React.createElement('svg', {
      width: svgWidth, height: ROW_HEIGHT,
      style: { flexShrink: 0 },
    }, ...elements)
  }

  // ── Render ref labels ──
  const renderRefs = (refs: string[]) => {
    if (!refs.length) return null
    return refs.map((ref, i) => {
      const parsed = parseRef(ref)
      if (parsed.isRemote && !parsed.isHead) return null
      const isTag = parsed.isTag
      const agentOnBranch = agentBranches.get(parsed.label)

      const bg = parsed.isHead ? '#6366f125' : isTag ? '#fbbf2420' : 'var(--bg-elevated)'
      const border = parsed.isHead ? '#6366f166' : isTag ? '#fbbf2466' : 'var(--border-default)'
      const color = parsed.isHead ? 'var(--accent)' : isTag ? 'var(--waiting)' : 'var(--text-secondary)'

      return React.createElement('span', {
        key: i,
        style: {
          padding: '0 5px', background: bg, border: `1px solid ${border}`,
          borderRadius: '3px', fontSize: '10px', color, whiteSpace: 'nowrap' as const,
          display: 'inline-flex', alignItems: 'center', gap: '3px',
        },
      },
        agentOnBranch
          ? React.createElement('span', {
              style: {
                width: '5px', height: '5px', borderRadius: '50%',
                backgroundColor: agentOnBranch.status === 'working' ? 'var(--working)' : agentOnBranch.status === 'waiting' ? 'var(--waiting)' : 'var(--text-disabled)',
              },
            })
          : null,
        parsed.label.replace('HEAD -> ', ''),
      )
    }).filter(Boolean)
  }

  // ── Code mode row ──
  const renderCodeRow = (commit: CommitWithLane, index: number) => {
    const isSelected = selectedCommit?.hash === commit.hash

    return React.createElement('div', {
      key: commit.hash,
      onClick: () => setSelectedCommit(isSelected ? null : commit),
      style: {
        display: 'flex', alignItems: 'center', height: ROW_HEIGHT + 'px',
        padding: '0 8px 0 0', cursor: 'pointer',
        background: isSelected ? 'var(--bg-selected)' : commit.isAgent ? `${commit.laneColor}08` : 'transparent',
        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'background 100ms',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' },
      onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { if (!isSelected) e.currentTarget.style.background = commit.isAgent ? `${commit.laneColor}08` : 'transparent' },
    },
      // SVG graph
      renderGraphSvg(commit, index),
      // Hash
      React.createElement('span', {
        style: { width: '56px', fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'Consolas, monospace', flexShrink: 0 },
      }, commit.hashShort),
      // Message + refs
      React.createElement('div', {
        style: {
          flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
          overflow: 'hidden', minWidth: 0,
        },
      },
        React.createElement('span', {
          style: {
            fontSize: 'var(--text-base)', color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          },
        }, commit.message),
        ...(renderRefs(commit.refs) || []),
      ),
      // Author avatar + name
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '4px', width: '130px', flexShrink: 0, overflow: 'hidden' },
      },
        renderAvatar(commit, avatarCache, 16),
        React.createElement('span', {
          style: { fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
        }, commit.author),
      ),
      // Time
      React.createElement('span', {
        style: { width: '40px', fontSize: '11px', color: 'var(--text-disabled)', textAlign: 'right' as const, flexShrink: 0 },
        title: new Date(commit.date).toLocaleString(),
      }, formatTimeAgo(commit.date)),
    )
  }

  // ── People mode ──
  const renderPeopleMode = () => {
    const { agents, humans } = authorGroups

    if (agents.length === 0 && humans.length === 0) {
      return React.createElement('div', {
        style: { padding: '40px', textAlign: 'center' as const, color: 'var(--text-tertiary)' },
      }, 'No commits found')
    }

    const renderAuthorSection = (
      group: { author: string; email: string; commits: CommitWithLane[]; isAgent: boolean },
    ) => {
      return React.createElement('div', {
        key: group.email,
        style: { padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)' },
      },
        // Author header
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
        },
          renderAvatar(
            { ...group.commits[0], isAgent: group.isAgent } as CommitWithLane,
            avatarCache,
            32,
          ),
          React.createElement('div', null,
            React.createElement('div', {
              style: { color: 'var(--text-primary)', fontSize: 'var(--text-md)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' },
            },
              group.author,
              group.isAgent
                ? React.createElement('span', {
                    style: {
                      fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
                      background: getAgentAvatarColor(group.commits[0]) + '20',
                      color: getAgentAvatarColor(group.commits[0]),
                      fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                    },
                  }, 'Agent')
                : null,
            ),
            React.createElement('div', {
              style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' },
            }, group.email),
          ),
          React.createElement('span', {
            style: {
              marginLeft: 'auto', padding: '2px 8px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', borderRadius: '10px',
              fontSize: '11px', color: 'var(--text-secondary)',
            },
          }, `${group.commits.length} commits`),
        ),
        // Commit list for this author
        React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column' as const, gap: '2px', paddingLeft: '42px' },
        },
          ...group.commits.slice(0, 10).map(c =>
            React.createElement('div', {
              key: c.hash,
              onClick: () => setSelectedCommit(c),
              style: {
                display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 100ms',
              },
              onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
              onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'transparent' },
            },
              React.createElement('span', {
                style: { width: '8px', height: '8px', borderRadius: c.isAgent ? '2px' : '50%', background: c.laneColor, flexShrink: 0, transform: c.isAgent ? 'rotate(45deg)' : 'none' },
              }),
              React.createElement('span', {
                style: { fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'Consolas, monospace', flexShrink: 0 },
              }, c.hashShort),
              React.createElement('span', {
                style: { fontSize: 'var(--text-sm)', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
              }, c.message),
              React.createElement('span', {
                style: { fontSize: '10px', color: 'var(--text-disabled)', flexShrink: 0 },
              }, formatTimeAgo(c.date)),
            )
          ),
          group.commits.length > 10
            ? React.createElement('div', {
                style: { padding: '4px 8px', fontSize: '11px', color: 'var(--text-disabled)' },
              }, `+ ${group.commits.length - 10} more`)
            : null,
        ),
      )
    }

    return React.createElement('div', {
      style: { flex: 1, overflowY: 'auto' as const, padding: '8px 0' },
    },
      // Agents section header
      agents.length > 0
        ? React.createElement(React.Fragment, null,
            React.createElement('div', {
              style: {
                padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px',
                borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
              },
            },
              React.createElement(Bot, { size: 13, color: 'var(--accent)' }),
              React.createElement('span', {
                style: { fontSize: '11px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
              }, 'Agents'),
              React.createElement('span', {
                style: { fontSize: '10px', color: 'var(--text-disabled)' },
              }, `${agents.reduce((sum, g) => sum + g.commits.length, 0)} commits`),
            ),
            ...agents.map(renderAuthorSection),
          )
        : null,
      // Humans section header
      humans.length > 0
        ? React.createElement(React.Fragment, null,
            React.createElement('div', {
              style: {
                padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px',
                borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)',
              },
            },
              React.createElement(User, { size: 13, color: 'var(--text-secondary)' }),
              React.createElement('span', {
                style: { fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
              }, 'Contributors'),
              React.createElement('span', {
                style: { fontSize: '10px', color: 'var(--text-disabled)' },
              }, `${humans.reduce((sum, g) => sum + g.commits.length, 0)} commits`),
            ),
            ...humans.map(renderAuthorSection),
          )
        : null,
    )
  }

  // ── Detail panel ──
  const renderDetailPanel = () => {
    if (!selectedCommit) return null
    const c = selectedCommit
    const isMerge = c.parents.length > 1

    return React.createElement('div', {
      style: {
        width: '320px', borderLeft: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column' as const, overflow: 'hidden',
        flexShrink: 0, animation: 'fadeIn 0.15s ease-out',
      },
    },
      // Header
      React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-default)' },
      },
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '8px' },
        },
          React.createElement('span', { style: { color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 500 } }, 'Commit details'),
          // Agent / Human badge
          React.createElement('span', {
            style: {
              fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: 600,
              letterSpacing: '0.04em', textTransform: 'uppercase' as const,
              background: c.isAgent ? getAgentAvatarColor(c) + '20' : 'var(--bg-elevated)',
              color: c.isAgent ? getAgentAvatarColor(c) : 'var(--text-tertiary)',
              border: `1px solid ${c.isAgent ? getAgentAvatarColor(c) + '44' : 'var(--border-default)'}`,
            },
          }, c.isAgent ? 'Agent' : 'Human'),
          // Merge indicator
          isMerge
            ? React.createElement('span', {
                style: {
                  fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: 600,
                  background: '#a78bfa20', color: '#a78bfa', border: '1px solid #a78bfa44',
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                },
              },
                React.createElement(GitMerge, { size: 9 }),
                'Merge',
              )
            : null,
        ),
        React.createElement('button', {
          onClick: () => setSelectedCommit(null),
          style: { background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', fontSize: '14px', transition: 'color 100ms', display: 'flex', alignItems: 'center' },
          onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-primary)' },
          onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text-disabled)' },
        }, React.createElement(X, { size: 14 })),
      ),
      // Content
      React.createElement('div', {
        style: { flex: 1, overflowY: 'auto' as const, padding: '14px' },
      },
        // Author with avatar
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
        },
          renderAvatar(c, avatarCache, 40),
          React.createElement('div', null,
            React.createElement('div', {
              style: { color: 'var(--text-primary)', fontSize: 'var(--text-md)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' },
            },
              c.author,
              c.isAgent
                ? React.createElement('span', {
                    style: { display: 'flex', alignItems: 'center' },
                    title: 'Agent commit',
                  }, React.createElement(Bot, { size: 12, color: getAgentAvatarColor(c) }))
                : null,
            ),
            React.createElement('div', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' } }, c.authorEmail),
            React.createElement('div', { style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' } },
              formatTimeAgo(c.date) + ' \u00B7 ' + new Date(c.date).toLocaleDateString()),
          ),
        ),
        // Agent info
        c.isAgent
          ? React.createElement('div', {
              style: {
                padding: '8px 10px', marginBottom: '12px', borderRadius: '6px',
                background: getAgentAvatarColor(c) + '10',
                border: `1px solid ${getAgentAvatarColor(c)}22`,
                display: 'flex', alignItems: 'center', gap: '8px',
              },
            },
              React.createElement(Bot, { size: 14, color: getAgentAvatarColor(c) }),
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' } }, 'Agent commit'),
                React.createElement('div', { style: { fontSize: '10px', color: 'var(--text-tertiary)' } },
                  c.refs.length > 0
                    ? `Branch: ${c.refs.map(r => r.replace('refs/heads/', '').replace(/HEAD -> /, '')).filter(r => !r.includes('refs/')).join(', ') || 'detached'}`
                    : 'No branch ref',
                ),
              ),
            )
          : null,
        // Merge info
        isMerge
          ? React.createElement('div', {
              style: {
                padding: '8px 10px', marginBottom: '12px', borderRadius: '6px',
                background: '#a78bfa10', border: '1px solid #a78bfa22',
                display: 'flex', alignItems: 'center', gap: '8px',
              },
            },
              React.createElement(GitMerge, { size: 14, color: '#a78bfa' }),
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' } }, `Merge commit (${c.parents.length} parents)`),
                React.createElement('div', { style: { fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'Consolas, monospace' } },
                  c.parents.map(p => p.slice(0, 7)).join(' + '),
                ),
              ),
            )
          : null,
        // Hash
        React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' },
        },
          React.createElement('code', {
            style: { fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'Consolas, monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
          }, c.hash),
          React.createElement('button', {
            onClick: handleCopyHash,
            style: {
              padding: '2px 8px', background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)', color: copiedHash ? 'var(--working)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '10px', flexShrink: 0, transition: 'all 100ms',
              display: 'flex', alignItems: 'center', gap: '3px',
            },
          },
            copiedHash
              ? React.createElement(Check, { size: 10 })
              : React.createElement(Copy, { size: 10 }),
            copiedHash ? 'Copied' : 'Copy',
          ),
        ),
        // Message (full, with line breaks)
        React.createElement('div', {
          style: { color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: '8px', lineHeight: '1.4' },
        }, c.message),
        // Body
        c.body
          ? React.createElement('div', {
              style: {
                padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                lineHeight: '1.5', marginBottom: '12px', whiteSpace: 'pre-wrap' as const,
              },
            }, c.body)
          : null,
        // Refs
        c.refs.length > 0
          ? React.createElement('div', {
              style: { display: 'flex', gap: '4px', flexWrap: 'wrap' as const, marginBottom: '12px' },
            }, ...renderRefs(c.refs)!)
          : null,
        // Parents
        c.parents.length > 0
          ? React.createElement('div', { style: { marginBottom: '12px' } },
              React.createElement('div', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' } }, 'Parents'),
              ...c.parents.map(p =>
                React.createElement('div', {
                  key: p,
                  onClick: () => {
                    const parent = commits.find(cc => cc.hash === p)
                    if (parent) setSelectedCommit(parent)
                  },
                  style: { fontSize: '11px', color: 'var(--accent)', fontFamily: 'Consolas, monospace', cursor: 'pointer', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' },
                },
                  React.createElement(GitBranch, { size: 10 }),
                  p.slice(0, 7),
                )
              ),
            )
          : null,
        // Files changed
        React.createElement('div', { style: { marginBottom: '12px' } },
          React.createElement('div', {
            style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
          }, `Files changed${commitFiles.length ? ` (${commitFiles.length})` : ''}`),
          commitFilesLoading
            ? React.createElement('div', { style: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' } }, 'Loading...')
            : commitFiles.length === 0
              ? React.createElement('div', { style: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' } }, 'No files')
              : React.createElement('div', { style: { display: 'flex', flexDirection: 'column' as const, gap: '2px' } },
                  ...commitFiles.map(f =>
                    React.createElement('div', {
                      key: f.path,
                      style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0' },
                    },
                      React.createElement('span', {
                        style: { fontSize: '10px', fontWeight: 600, color: fileStatusColor(f.status), width: '10px', flexShrink: 0 },
                      }, fileStatusIcon(f.status)),
                      React.createElement('span', {
                        style: { fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Consolas, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1 },
                      }, f.path.split(/[\\/]/).pop()),
                      // +X -Y stats
                      f.additions >= 0 || f.deletions >= 0
                        ? React.createElement('span', {
                            style: { fontSize: '10px', fontFamily: 'Consolas, monospace', flexShrink: 0, display: 'flex', gap: '4px' },
                          },
                            f.additions > 0
                              ? React.createElement('span', { style: { color: 'var(--working)' } }, `+${f.additions}`)
                              : null,
                            f.deletions > 0
                              ? React.createElement('span', { style: { color: 'var(--error)' } }, `-${f.deletions}`)
                              : null,
                          )
                        : null,
                    )
                  ),
                ),
        ),
        // Actions
        React.createElement('div', {
          style: { display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-default)' },
        },
          React.createElement('button', {
            onClick: handleCheckout,
            style: {
              padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)',
              transition: 'all 100ms', display: 'flex', alignItems: 'center', gap: '4px',
            },
            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--text-secondary)' },
            onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.borderColor = 'var(--border-default)' },
          },
            React.createElement(RotateCcw, { size: 11 }),
            'Checkout',
          ),
        ),
      ),
    )
  }

  // ── Main render ──
  return React.createElement('div', {
    style: { height: '100%', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
  },
    // Toolbar
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
        borderBottom: '1px solid var(--border-default)', flexShrink: 0, overflowX: 'auto' as const,
      },
    },
      // Mode toggle
      React.createElement('div', {
        style: { display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 },
      },
        React.createElement('button', {
          onClick: () => setMode('code'),
          style: {
            padding: '4px 12px', fontSize: 'var(--text-xs)', cursor: 'pointer', border: 'none',
            background: mode === 'code' ? 'var(--accent)' : 'var(--bg-elevated)',
            color: mode === 'code' ? '#fff' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
          },
        }, 'Code'),
        React.createElement('button', {
          onClick: () => setMode('people'),
          style: {
            padding: '4px 12px', fontSize: 'var(--text-xs)', cursor: 'pointer', border: 'none',
            background: mode === 'people' ? 'var(--accent)' : 'var(--bg-elevated)',
            color: mode === 'people' ? '#fff' : 'var(--text-secondary)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          },
        }, 'People'),
      ),
      // Separator
      React.createElement('div', { style: { width: '1px', height: '16px', background: 'var(--border-default)' } }),
      // Branch pills
      React.createElement('button', {
        onClick: () => setBranchFilter(null),
        style: {
          padding: '2px 8px', fontSize: '10px', cursor: 'pointer',
          background: !branchFilter ? 'var(--accent)' : 'transparent',
          border: !branchFilter ? '1px solid var(--accent)' : '1px solid var(--border-default)',
          borderRadius: '10px', color: !branchFilter ? '#fff' : 'var(--text-secondary)',
          flexShrink: 0, transition: 'all 100ms',
        },
      }, 'All'),
      ...localBranches.slice(0, 8).map(b => {
        const agent = agentBranches.get(b)
        const isActive = branchFilter === b
        return React.createElement('button', {
          key: b,
          onClick: () => setBranchFilter(isActive ? null : b),
          style: {
            padding: '2px 8px', fontSize: '10px', cursor: 'pointer',
            background: isActive ? 'var(--bg-selected)' : 'transparent',
            border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-default)',
            borderRadius: '10px', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 100ms',
          },
        },
          agent
            ? React.createElement('span', {
                style: { width: '5px', height: '5px', borderRadius: '50%', backgroundColor: agent.status === 'working' ? 'var(--working)' : agent.status === 'waiting' ? 'var(--waiting)' : 'var(--text-disabled)' },
              })
            : null,
          b,
        )
      }),
      // Type filter
      React.createElement('select', {
        value: typeFilter,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value as 'all' | 'merges' | 'agent' | 'human'),
        style: {
          padding: '2px 6px', fontSize: '10px', background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', flexShrink: 0,
        },
      },
        React.createElement('option', { value: 'all' }, 'All'),
        React.createElement('option', { value: 'merges' }, 'Merges only'),
        React.createElement('option', { value: 'agent' }, 'Agent commits'),
        React.createElement('option', { value: 'human' }, 'Human commits'),
      ),
      React.createElement('div', { style: { flex: 1 } }),
      // Commit count
      React.createElement('span', {
        style: { fontSize: 'var(--text-xs)', color: 'var(--text-disabled)', flexShrink: 0 },
      }, `${filteredCommits.length} commits`),
      // Search
      isSearchOpen
        ? React.createElement('input', {
            value: searchQuery,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Escape') { setIsSearchOpen(false); setSearchQuery('') } },
            autoFocus: true,
            placeholder: 'Search commits...',
            style: {
              width: '200px', padding: '3px 8px', background: 'var(--bg-app)', border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 'var(--text-xs)',
              outline: 'none', fontFamily: 'inherit', transition: 'width 200ms',
            },
          })
        : null,
      React.createElement('button', {
        onClick: () => { setIsSearchOpen(!isSearchOpen); if (isSearchOpen) setSearchQuery('') },
        style: {
          background: 'none', border: 'none', cursor: 'pointer', color: isSearchOpen ? 'var(--accent)' : 'var(--text-disabled)',
          fontSize: 'var(--text-sm)', padding: '2px 4px', flexShrink: 0, transition: 'color 100ms',
          display: 'flex', alignItems: 'center',
        },
      }, React.createElement(Search, { size: 13 })),
    ),

    // Content area
    React.createElement('div', {
      style: { flex: 1, display: 'flex', overflow: 'hidden' },
    },
      // Main list
      React.createElement('div', {
        style: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
      },
        mode === 'code'
          ? React.createElement('div', {
              ref: scrollContainerRef,
              onScroll: (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop),
              style: { flex: 1, overflowY: 'auto' as const },
            },
              React.createElement('div', {
                style: { height: totalHeight + 'px', position: 'relative' as const },
              },
                React.createElement('div', {
                  style: { position: 'absolute' as const, top: 0, left: 0, right: 0, transform: `translateY(${offsetY}px)` },
                },
                  ...filteredCommits.slice(startIndex, endIndex).map((c, i) =>
                    renderCodeRow(c, startIndex + i)
                  ),
                ),
              ),
            )
          : renderPeopleMode(),
      ),

      // Detail panel
      renderDetailPanel(),
    ),
  )
}

export default GitHistory
