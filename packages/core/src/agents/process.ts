import { execFile } from 'child_process'

/**
 * Get running Node.js process command lines on Windows.
 * Uses wmic with a 1-second timeout — returns empty array if it takes longer.
 */
export async function getRunningNodeProcesses(): Promise<string[]> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve([]), 1000)

    execFile(
      'wmic',
      ['process', 'where', 'name="node.exe"', 'get', 'commandline'],
      { timeout: 1000 },
      (err, stdout) => {
        clearTimeout(timeout)
        if (err || !stdout) {
          resolve([])
          return
        }
        const lines = stdout
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && line !== 'CommandLine')
        resolve(lines)
      }
    )
  })
}
