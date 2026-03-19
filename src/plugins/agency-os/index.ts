import { AgentflowPlugin, PluginContext } from '../types.js'
import { detectAgencyOS } from './detect.js'
import { readFileSafe, fileExists, listDirs, splitLines } from '../../utils/fs.js'
import { joinPath } from '../../utils/paths.js'
import AgencyOSPanel from './panel.js'

interface ClientInfo {
  name: string
  slug: string
  hasActiveTests: boolean
  hasWinners: boolean
  hypothesisCount: number
}

async function loadClients(clientsPath: string): Promise<ClientInfo[]> {
  const dirs = await listDirs(clientsPath)
  const clients: ClientInfo[] = []

  for (const slug of dirs) {
    const clientPath = joinPath(clientsPath, slug)

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
    const hasWinners = await fileExists(joinPath(clientPath, 'winners.md'))

    let hypothesisCount = 0
    const hypothesisLog = await readFileSafe(joinPath(clientPath, 'hypothesis-log.md'))
    if (hypothesisLog) {
      hypothesisCount = (hypothesisLog.match(/^- \[ \]/gm) || []).length
    }

    clients.push({ name, slug, hasActiveTests, hasWinners, hypothesisCount })
  }

  return clients
}

const agencyOSPlugin: AgentflowPlugin = {
  name: 'agency-os',
  priority: 30,
  detect: detectAgencyOS,
  async load(rootPath: string): Promise<PluginContext> {
    const clientsPath = joinPath(rootPath, 'agency', 'clients')
    const clients = await loadClients(clientsPath)
    return {
      pluginName: 'agency-os',
      summary: `Agency OS — ${clients.length} cliente(s) ativo(s)`,
      data: { clients },
    }
  },
  Panel: AgencyOSPanel,
}

export default agencyOSPlugin
