import { execa } from 'execa'

/**
 * Get running Node.js process command lines on Windows.
 * Uses wmic with a 1-second timeout — returns empty array if it takes longer.
 */
export async function getRunningNodeProcesses(): Promise<string[]> {
  try {
    const { stdout } = await execa(
      'wmic',
      ['process', 'where', 'name="node.exe"', 'get', 'commandline'],
      { timeout: 1000 }
    )
    return stdout
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line !== 'CommandLine')
  } catch {
    return []
  }
}
