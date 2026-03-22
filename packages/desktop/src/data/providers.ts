// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import { Sparkles, Target, Gem, Hexagon, Zap, Palette, Play, Circle, type LucideIcon } from 'lucide-react'

export interface CliProvider {
  id: string
  name: string
  command: string
  args?: string[]
  icon: string
  Icon: LucideIcon
  color: string
  installUrl: string
  modelFlag?: string
  planFlag?: string
  autoApproveFlag?: string
}

export const CLI_PROVIDERS: CliProvider[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    icon: '\u2733',
    Icon: Sparkles,
    color: '#d97706',
    installUrl: 'https://docs.anthropic.com/claude-code',
    modelFlag: '--model',
    planFlag: '--plan',
    autoApproveFlag: '--dangerously-skip-permissions',
  },
  {
    id: 'codex',
    name: 'Codex',
    command: 'codex',
    icon: '\u25CE',
    Icon: Target,
    color: '#10b981',
    installUrl: 'https://github.com/openai/codex',
    autoApproveFlag: '--approval-mode full-auto',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    command: 'gemini',
    icon: '\u25C8',
    Icon: Gem,
    color: '#3b82f6',
    installUrl: 'https://github.com/google-gemini/gemini-cli',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode',
    icon: '\u2B21',
    Icon: Hexagon,
    color: '#8b5cf6',
    installUrl: 'https://opencode.ai',
  },
  {
    id: 'amp',
    name: 'Amp',
    command: 'amp',
    icon: '\u26A1',
    Icon: Zap,
    color: '#f59e0b',
    installUrl: 'https://ampcode.com',
  },
  {
    id: 'aider',
    name: 'Aider',
    command: 'aider',
    icon: '\u25E7',
    Icon: Palette,
    color: '#06b6d4',
    installUrl: 'https://aider.chat',
  },
  {
    id: 'continue',
    name: 'Continue',
    command: 'continue',
    icon: '\u25B7',
    Icon: Play,
    color: '#6366f1',
    installUrl: 'https://continue.dev',
  },
  {
    id: 'cline',
    name: 'Cline',
    command: 'cline',
    icon: '\u25D1',
    Icon: Circle,
    color: '#ec4899',
    installUrl: 'https://github.com/cline/cline',
  },
]

export function getProviderById(id: string): CliProvider | undefined {
  return CLI_PROVIDERS.find(p => p.id === id)
}

export function buildLaunchCommand(
  provider: CliProvider,
  model?: string,
  mode?: 'normal' | 'plan' | 'auto',
): string {
  const parts = [provider.command]

  if (model && provider.modelFlag) {
    parts.push(provider.modelFlag, model)
  }

  if (mode === 'plan' && provider.planFlag) {
    parts.push(provider.planFlag)
  }

  if (mode === 'auto' && provider.autoApproveFlag) {
    parts.push(provider.autoApproveFlag)
  }

  return parts.join(' ')
}
