import { dirExists, listDirs, readFileSafe, splitLines, joinPath } from '../../git/utils'

export interface BmadData {
  agents: string[]
  phase?: string
}

/**
 * Read BMAD workflow data from a project.
 */
export async function readBmadData(rootPath: string): Promise<BmadData> {
  let agents: string[] = []

  // Try to list agents from .claude/agents/
  const agentsDir = joinPath(rootPath, '.claude', 'agents')
  if (await dirExists(agentsDir)) {
    agents = await listDirs(agentsDir)
  }

  // Try to detect current phase from .bmad/
  let phase: string | undefined
  const bmadDir = joinPath(rootPath, '.bmad')
  if (await dirExists(bmadDir)) {
    const statusFile = await readFileSafe(joinPath(bmadDir, 'status.md'))
    if (statusFile) {
      const phaseLine = splitLines(statusFile).find(l => /phase|fase/i.test(l))
      if (phaseLine) {
        phase = phaseLine.replace(/^[#\-*\s]+/, '').trim()
      }
    }
  }

  return { agents, phase }
}
