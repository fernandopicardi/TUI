import { RegentPlugin, PluginContext } from '../../types/plugin'
import { detectBMAD } from './detect'
import { readBmadData } from './reader'

const bmadPlugin: RegentPlugin = {
  name: 'bmad',
  priority: 90,
  detect: detectBMAD,
  async load(rootPath: string): Promise<PluginContext> {
    const data = await readBmadData(rootPath)
    return {
      pluginName: 'bmad',
      summary: `BMAD — ${data.agents.length} agente(s)`,
      data: { ...data } as Record<string, unknown>,
    }
  },
}

export default bmadPlugin
