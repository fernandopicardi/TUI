// Copyright (c) 2026 Regent. All rights reserved.
// Proprietary and confidential. Unauthorized use prohibited.

export type Plan = 'free' | 'pro' | 'business' | 'enterprise'

export interface FeatureFlags {
  // Projects
  maxProjects: number
  maxAgentsPerProject: number

  // Core features — always available
  terminalIntegrated: true
  worktreeSync: true
  pluginDetection: true
  commandPalette: true
  quickPrompt: true

  // Pro features
  gitHistoryFull: boolean
  prFlow: boolean
  broadcastPrompts: boolean
  costTracker: boolean
  mcpManager: boolean
  promptTemplates: boolean
  sessionNotes: boolean

  // Business features
  teamPresence: boolean
  sharedWorkspaces: boolean
  teamDashboard: boolean
  launchpad: boolean
  centralizedBilling: boolean
  roles: boolean

  // Enterprise features
  sso: boolean
  auditLog: boolean
  selfHosted: boolean
  advancedRoles: boolean
}

export const PLAN_FLAGS: Record<Plan, FeatureFlags> = {
  free: {
    maxProjects: 3,
    maxAgentsPerProject: 2,
    terminalIntegrated: true,
    worktreeSync: true,
    pluginDetection: true,
    commandPalette: true,
    quickPrompt: true,
    gitHistoryFull: false,
    prFlow: false,
    broadcastPrompts: false,
    costTracker: false,
    mcpManager: false,
    promptTemplates: false,
    sessionNotes: false,
    teamPresence: false,
    sharedWorkspaces: false,
    teamDashboard: false,
    launchpad: false,
    centralizedBilling: false,
    roles: false,
    sso: false,
    auditLog: false,
    selfHosted: false,
    advancedRoles: false,
  },
  pro: {
    maxProjects: Infinity,
    maxAgentsPerProject: Infinity,
    terminalIntegrated: true,
    worktreeSync: true,
    pluginDetection: true,
    commandPalette: true,
    quickPrompt: true,
    gitHistoryFull: true,
    prFlow: true,
    broadcastPrompts: true,
    costTracker: true,
    mcpManager: true,
    promptTemplates: true,
    sessionNotes: true,
    teamPresence: false,
    sharedWorkspaces: false,
    teamDashboard: false,
    launchpad: false,
    centralizedBilling: false,
    roles: false,
    sso: false,
    auditLog: false,
    selfHosted: false,
    advancedRoles: false,
  },
  business: {
    maxProjects: Infinity,
    maxAgentsPerProject: Infinity,
    terminalIntegrated: true,
    worktreeSync: true,
    pluginDetection: true,
    commandPalette: true,
    quickPrompt: true,
    gitHistoryFull: true,
    prFlow: true,
    broadcastPrompts: true,
    costTracker: true,
    mcpManager: true,
    promptTemplates: true,
    sessionNotes: true,
    teamPresence: true,
    sharedWorkspaces: true,
    teamDashboard: true,
    launchpad: true,
    centralizedBilling: true,
    roles: true,
    sso: false,
    auditLog: false,
    selfHosted: false,
    advancedRoles: false,
  },
  enterprise: {
    maxProjects: Infinity,
    maxAgentsPerProject: Infinity,
    terminalIntegrated: true,
    worktreeSync: true,
    pluginDetection: true,
    commandPalette: true,
    quickPrompt: true,
    gitHistoryFull: true,
    prFlow: true,
    broadcastPrompts: true,
    costTracker: true,
    mcpManager: true,
    promptTemplates: true,
    sessionNotes: true,
    teamPresence: true,
    sharedWorkspaces: true,
    teamDashboard: true,
    launchpad: true,
    centralizedBilling: true,
    roles: true,
    sso: true,
    auditLog: true,
    selfHosted: true,
    advancedRoles: true,
  },
}

// Current active plan — hardcoded to 'free' until billing is connected
export const CURRENT_PLAN: Plan = 'free'

export function getFlags(): FeatureFlags {
  return PLAN_FLAGS[CURRENT_PLAN]
}

export function hasFeature(flag: keyof FeatureFlags): boolean {
  const flags = getFlags()
  const value = flags[flag]
  if (typeof value === 'boolean') return value
  return true
}

export function canAddProject(currentCount: number): boolean {
  const { maxProjects } = getFlags()
  return maxProjects === Infinity || currentCount < maxProjects
}

export function canAddAgent(currentCount: number): boolean {
  const { maxAgentsPerProject } = getFlags()
  return maxAgentsPerProject === Infinity || currentCount < maxAgentsPerProject
}
