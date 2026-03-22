import { GitCommitData } from '../types'

export interface CommitWithLane extends GitCommitData {
  lane: number
  laneColor: string
  mergeFrom: number[]
  isAgent: boolean
}

export const LANE_COLORS = [
  '#6366f1',  // accent — main
  '#4ade80',  // green
  '#a78bfa',  // purple
  '#f472b6',  // pink
  '#38bdf8',  // sky
  '#fb923c',  // orange
  '#34d399',  // emerald
  '#f87171',  // red
  '#fbbf24',  // amber
  '#60a5fa',  // blue
]

export function getLaneColor(lane: number): string {
  return LANE_COLORS[lane % LANE_COLORS.length]
}

const AGENT_EMAIL_PATTERNS = [
  'claude@anthropic',
  'claude-code@',
  'agent@',
  'noreply@claude',
  'noreply@anthropic',
  '@claude.ai',
]

const AGENT_COAUTHOR_KEYWORDS = [
  'claude', 'copilot', 'cursor', 'codeium', 'codex',
]

/**
 * Determines if a commit was made by or with an agent.
 * Checks (in order): email patterns, author name, Co-Authored-By in body, branch matching.
 */
export function detectAgentCommit(
  commit: GitCommitData,
  agentBranches?: Set<string>,
): boolean {
  const email = commit.authorEmail.toLowerCase()
  const name = commit.author.toLowerCase()
  const body = (commit.body || '').toLowerCase()

  // 1. Email patterns
  if (AGENT_EMAIL_PATTERNS.some(p => email.includes(p))) return true

  // 2. Author name contains agent identifier
  if (name.includes('claude') || name.includes('copilot') || name.includes('cursor')) return true

  // 3. Co-Authored-By line references an agent
  if (body.includes('co-authored-by')) {
    if (AGENT_COAUTHOR_KEYWORDS.some(k => body.includes(k))) return true
  }

  // 4. Commit is on a branch that belongs to a known agent in the store
  if (agentBranches && agentBranches.size > 0) {
    for (const ref of commit.refs) {
      const cleaned = ref
        .replace('refs/heads/', '')
        .replace('refs/remotes/origin/', '')
        .replace(/HEAD -> /, '')
        .trim()
      if (cleaned && agentBranches.has(cleaned)) return true
    }
  }

  return false
}

/** Backwards-compatible alias — email-only check */
export function isAgentCommit(email: string): boolean {
  return AGENT_EMAIL_PATTERNS.some(p => email.toLowerCase().includes(p))
}

export function assignLanes(
  commits: GitCommitData[],
  agentBranches?: Set<string>,
): CommitWithLane[] {
  if (!commits.length) return []

  const lanes: (string | null)[] = []
  const result: CommitWithLane[] = []

  const allocateLane = (): number => {
    const free = lanes.indexOf(null)
    if (free !== -1) return free
    lanes.push(null)
    return lanes.length - 1
  }

  commits.forEach((commit) => {
    let lane = -1
    const mergeFrom: number[] = []

    // Check if any lane expects this commit
    lanes.forEach((expectedHash, i) => {
      if (expectedHash === commit.hash) {
        if (lane === -1) {
          lane = i
        } else {
          mergeFrom.push(i)
        }
      }
    })

    if (lane === -1) lane = allocateLane()

    // This lane now expects our first parent
    lanes[lane] = commit.parents[0] ?? null

    // Extra parents (merge commits) — assign to new lanes or find existing
    commit.parents.slice(1).forEach(parentHash => {
      const existingLane = lanes.indexOf(parentHash)
      if (existingLane !== -1 && existingLane !== lane) {
        // Lane already tracking this parent — it's a merge
        if (!mergeFrom.includes(existingLane)) mergeFrom.push(existingLane)
      } else {
        // Allocate new lane for this parent
        const newLane = allocateLane()
        lanes[newLane] = parentHash
        mergeFrom.push(newLane)
      }
    })

    // Clean up merge-from lanes that converge here
    mergeFrom.forEach(ml => {
      if (lanes[ml] === commit.hash) {
        lanes[ml] = null
      }
    })

    result.push({
      ...commit,
      lane,
      laneColor: getLaneColor(lane),
      mergeFrom,
      isAgent: detectAgentCommit(commit, agentBranches),
    })
  })

  return result
}

/**
 * Computes which lanes should have vertical lines drawn at a given row.
 * Looks at ±2 neighboring commits for lane continuity.
 */
export function getActiveLanesAt(commits: CommitWithLane[], index: number): Set<number> {
  const active = new Set<number>()
  const start = Math.max(0, index - 2)
  const end = Math.min(commits.length, index + 3)
  for (let i = start; i < end; i++) {
    active.add(commits[i].lane)
    commits[i].mergeFrom.forEach(l => active.add(l))
  }
  return active
}

export function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w`
  const months = Math.floor(days / 30)
  return `${months}mo`
}
