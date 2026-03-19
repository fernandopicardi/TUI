import { joinPath, readFileSafe, fileExists, listDirs, splitLines } from '../../git/utils'

export interface AgencyClient {
  id: string
  name: string
  stack?: string
  url?: string
  loopStatus: 'active' | 'waiting' | 'winner-ready' | 'inactive'
  hypothesisCount: number
  lastCycleDate?: Date
  hasWinner: boolean
}

/**
 * Read all clients from the agency clients directory.
 */
export async function readClients(agencyPath: string): Promise<AgencyClient[]> {
  const dirs = await listDirs(agencyPath)
  const clients: AgencyClient[] = []

  for (const slug of dirs) {
    const clientPath = joinPath(agencyPath, slug)

    // Extract name from profile.md — fallback to folder name
    let name = slug
    const profile = await readFileSafe(joinPath(clientPath, 'profile.md'))
    if (profile) {
      const firstLine = splitLines(profile).find(l => l.trim().startsWith('#'))
      if (firstLine) {
        name = firstLine.replace(/^#+\s*/, '').trim() || slug
      }
    }

    const hasActiveTests = await fileExists(joinPath(clientPath, 'active-tests.md'))
    const hasWinner = await fileExists(joinPath(clientPath, 'winners.md'))

    let hypothesisCount = 0
    const hypothesisLog = await readFileSafe(joinPath(clientPath, 'hypothesis-log.md'))
    if (hypothesisLog) {
      hypothesisCount = (hypothesisLog.match(/^- \[ \]/gm) || []).length
    }

    // Determine loop status
    let loopStatus: AgencyClient['loopStatus'] = 'inactive'
    if (hasWinner) {
      loopStatus = 'winner-ready'
    } else if (hasActiveTests) {
      loopStatus = 'active'
    } else if (hypothesisCount > 0) {
      loopStatus = 'waiting'
    }

    clients.push({
      id: slug,
      name,
      loopStatus,
      hypothesisCount,
      hasWinner,
    })
  }

  return clients
}
