import { RunnioPlugin, PluginContext } from '../../types/plugin'
import { getRepoName } from '../../git/utils'
import { getCurrentBranch, listWorktrees } from '../../git/worktrees'

const rawPlugin: RunnioPlugin = {
  name: 'raw',
  priority: 0,
  async detect(): Promise<boolean> {
    return true
  },
  async load(rootPath: string): Promise<PluginContext> {
    const repoName = getRepoName(rootPath)
    const branch = await getCurrentBranch(rootPath)
    const worktrees = await listWorktrees(rootPath)
    return {
      pluginName: 'raw',
      summary: `${repoName} — ${branch}`,
      data: { repoName, branch, worktreeCount: worktrees.length },
    }
  },
}

export default rawPlugin
