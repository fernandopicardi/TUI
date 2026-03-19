import { dirExists } from '../../utils/fs.js'
import { joinPath } from '../../utils/paths.js'
import * as fs from 'fs'

export async function detectAgencyOS(rootPath: string): Promise<boolean> {
  // 1. Check for agency/clients/ directory
  if (await dirExists(joinPath(rootPath, 'agency', 'clients'))) {
    return true
  }

  // 2. Check for agency/ with subdirs containing profile.md
  const agencyPath = joinPath(rootPath, 'agency')
  if (await dirExists(agencyPath)) {
    try {
      const entries = await fs.promises.readdir(agencyPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const profilePath = joinPath(agencyPath, entry.name, 'profile.md')
          try {
            await fs.promises.access(profilePath)
            return true
          } catch {
            // continue checking
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return false
}
