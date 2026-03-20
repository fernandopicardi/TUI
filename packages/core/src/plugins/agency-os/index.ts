import { RegentPlugin, PluginContext } from '../../types/plugin'
import { detectAgencyOS } from './detect'
import { readClients } from './reader'
import { joinPath } from '../../git/utils'

const agencyOSPlugin: RegentPlugin = {
  name: 'agency-os',
  priority: 100,
  detect: detectAgencyOS,
  async load(rootPath: string): Promise<PluginContext> {
    const clientsPath = joinPath(rootPath, 'agency', 'clients')
    const clients = await readClients(clientsPath)
    return {
      pluginName: 'agency-os',
      summary: `Agency OS — ${clients.length} cliente(s) ativo(s)`,
      data: { clients },
    }
  },
}

export default agencyOSPlugin
