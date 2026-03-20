import { RunnioPlugin, PluginContext } from '../../types/plugin'
import { fileExists, readFileSafe, splitLines, joinPath } from '../../git/utils'
import { listWorktrees } from '../../git/worktrees'

const genericPlugin: RunnioPlugin = {
  name: 'generic',
  priority: 10,
  async detect(rootPath: string): Promise<boolean> {
    return fileExists(joinPath(rootPath, 'CLAUDE.md'))
  },
  async load(rootPath: string): Promise<PluginContext> {
    const content = await readFileSafe(joinPath(rootPath, 'CLAUDE.md'))
    let projectName = 'Project'
    if (content) {
      const firstLine = splitLines(content).find(l => l.trim().length > 0)
      if (firstLine) {
        projectName = firstLine.replace(/^#+\s*/, '').trim() || 'Project'
      }
    }
    const worktrees = await listWorktrees(rootPath)
    return {
      pluginName: 'generic',
      summary: `${projectName} — ${worktrees.length} worktree(s)`,
      data: { projectName, worktreeCount: worktrees.length },
    }
  },
}

export default genericPlugin
