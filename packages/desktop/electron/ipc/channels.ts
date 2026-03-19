export const IPC = {
  // Git
  LIST_WORKTREES: 'git:list-worktrees',
  CREATE_WORKTREE: 'git:create-worktree',
  REMOVE_WORKTREE: 'git:remove-worktree',
  WATCH_WORKTREES: 'git:watch-worktrees',
  GET_CURRENT_BRANCH: 'git:get-current-branch',

  // Agents
  GET_AGENT_STATUS: 'agent:get-status',
  WATCH_AGENT_STATUS: 'agent:watch-status',

  // Plugins
  RESOLVE_PLUGIN: 'plugin:resolve',
  LOAD_PLUGIN: 'plugin:load',

  // Config
  LOAD_CONFIG: 'config:load',

  // Terminal
  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_INPUT: 'terminal:input',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_OUTPUT: 'terminal:output',
  TERMINAL_CLOSE: 'terminal:close',

  // GitHub
  GITHUB_CREATE_PR: 'github:create-pr',
  GITHUB_GET_DIFF: 'github:get-diff',

  // Dialog
  OPEN_DIRECTORY: 'dialog:open-directory',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
} as const
