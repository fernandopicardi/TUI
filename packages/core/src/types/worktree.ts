export interface Worktree {
  path: string
  branch: string
  head: string
  isMain: boolean
  lastModified?: Date
}
