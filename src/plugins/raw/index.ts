import * as React from 'react'
import { Text, Box } from 'ink'
import { AgentflowPlugin, PluginContext } from '../types.js'
import { createGit, getRepoName, getCurrentBranch, listWorktrees } from '../../utils/git.js'

const RawPanel: React.FC<{ context: PluginContext }> = ({ context }) => {
  const data = context.data as { repoName: string; branch: string; worktreeCount: number }
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(
      Text,
      { bold: true },
      `◇ ${data.repoName} — ${data.branch} — ${data.worktreeCount} worktree(s)`
    )
  )
}

const rawPlugin: AgentflowPlugin = {
  name: 'raw',
  priority: 0,
  async detect(): Promise<boolean> {
    return true
  },
  async load(rootPath: string): Promise<PluginContext> {
    const git = createGit(rootPath)
    const repoName = await getRepoName(git)
    const branch = await getCurrentBranch(git)
    const worktrees = await listWorktrees(git)
    return {
      pluginName: 'raw',
      summary: `${repoName} — ${branch}`,
      data: { repoName, branch, worktreeCount: worktrees.length },
    }
  },
  Panel: RawPanel,
}

export default rawPlugin
