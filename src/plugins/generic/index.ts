import * as React from 'react'
import { Text, Box } from 'ink'
import { AgentflowPlugin, PluginContext } from '../types.js'
import { fileExists, readFileSafe } from '../../utils/fs.js'
import { joinPath } from '../../utils/paths.js'
import { createGit, listWorktrees } from '../../utils/git.js'

const GenericPanel: React.FC<{ context: PluginContext }> = ({ context }) => {
  const data = context.data as { projectName: string; worktreeCount: number }
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(
      Text,
      { bold: true },
      `◆ ${data.projectName} — ${data.worktreeCount} worktree(s)`
    )
  )
}

const genericPlugin: AgentflowPlugin = {
  name: 'generic',
  priority: 10,
  async detect(rootPath: string): Promise<boolean> {
    return fileExists(joinPath(rootPath, 'CLAUDE.md'))
  },
  async load(rootPath: string): Promise<PluginContext> {
    const content = await readFileSafe(joinPath(rootPath, 'CLAUDE.md'))
    let projectName = 'Project'
    if (content) {
      const firstLine = content.split('\n').find(l => l.trim().length > 0)
      if (firstLine) {
        projectName = firstLine.replace(/^#+\s*/, '').trim() || 'Project'
      }
    }
    const git = createGit(rootPath)
    const worktrees = await listWorktrees(git)
    return {
      pluginName: 'generic',
      summary: `${projectName} — ${worktrees.length} worktree(s)`,
      data: { projectName, worktreeCount: worktrees.length },
    }
  },
  Panel: GenericPanel,
}

export default genericPlugin
