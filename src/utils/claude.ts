import execa from 'execa'

let _claudeAvailable: boolean | null = null

export async function isClaudeInstalled(): Promise<boolean> {
  if (_claudeAvailable !== null) return _claudeAvailable
  try {
    await execa('claude', ['--version'], { timeout: 3000 })
    _claudeAvailable = true
  } catch {
    _claudeAvailable = false
  }
  return _claudeAvailable
}
