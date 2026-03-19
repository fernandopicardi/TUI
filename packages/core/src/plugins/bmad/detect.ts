import { dirExists, readFileSafe, joinPath } from '../../git/utils'

export async function detectBMAD(rootPath: string): Promise<boolean> {
  // 1. Check for .bmad/ directory
  if (await dirExists(joinPath(rootPath, '.bmad'))) {
    return true
  }

  // 2. Check CLAUDE.md for BMAD mention
  const claudeMd = await readFileSafe(joinPath(rootPath, 'CLAUDE.md'))
  if (claudeMd && /bmad/i.test(claudeMd)) {
    return true
  }

  // 3. Check for .claude/agents/ directory
  if (await dirExists(joinPath(rootPath, '.claude', 'agents'))) {
    return true
  }

  return false
}
