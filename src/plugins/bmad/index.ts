import { AgentflowPlugin, PluginContext } from '../types.js'
import { detectBMAD } from './detect.js'
import { dirExists, listDirs, readFileSafe } from '../../utils/fs.js'
import { joinPath } from '../../utils/paths.js'
import BMADPanel from './panel.js'

const bmadPlugin: AgentflowPlugin = {
  name: 'bmad',
  priority: 20,
  detect: detectBMAD,
  async load(rootPath: string): Promise<PluginContext> {
    let agents: string[] = []

    // Try to list agents from .claude/agents/
    const agentsDir = joinPath(rootPath, '.claude', 'agents')
    if (await dirExists(agentsDir)) {
      agents = await listDirs(agentsDir)
    }

    // Try to detect current phase from .bmad/ if present
    let phase: string | undefined
    const bmadDir = joinPath(rootPath, '.bmad')
    if (await dirExists(bmadDir)) {
      const statusFile = await readFileSafe(joinPath(bmadDir, 'status.md'))
      if (statusFile) {
        const phaseLine = statusFile.split('\n').find(l => /phase|fase/i.test(l))
        if (phaseLine) {
          phase = phaseLine.replace(/^[#\-*\s]+/, '').trim()
        }
      }
    }

    return {
      pluginName: 'bmad',
      summary: `BMAD — ${agents.length} agente(s)`,
      data: { agents, phase },
    }
  },
  Panel: BMADPanel,
}

export default bmadPlugin
