// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import * as React from 'react'
import { hasFeature } from '../features'
import type { FeatureFlags, Plan } from '../features'

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
}

const UPGRADE_MESSAGES: Partial<Record<keyof FeatureFlags, { title: string; description: string; requiredPlan: Plan }>> = {
  gitHistoryFull: {
    title: 'Full Git History',
    description: 'Visualize your complete branch graph with Code and People modes, avatar integration, and agent highlighting.',
    requiredPlan: 'pro',
  },
  prFlow: {
    title: 'Pull Request Flow',
    description: 'Create and manage pull requests directly from Runnio with full GitHub API integration.',
    requiredPlan: 'pro',
  },
  broadcastPrompts: {
    title: 'Broadcast Prompts',
    description: 'Send the same prompt to multiple agents simultaneously across all your projects.',
    requiredPlan: 'pro',
  },
  costTracker: {
    title: 'Cost Tracker',
    description: 'Monitor token usage and API costs per agent and per session in real time.',
    requiredPlan: 'pro',
  },
  mcpManager: {
    title: 'MCP Manager',
    description: 'Manage all your MCP servers from one place — add, remove, and inspect configurations.',
    requiredPlan: 'pro',
  },
  sessionNotes: {
    title: 'Session Notes',
    description: 'Add persistent notes to each agent session for tracking context and progress.',
    requiredPlan: 'pro',
  },
  teamPresence: {
    title: 'Team Presence',
    description: 'See which team members are online and what they are working on in real time.',
    requiredPlan: 'business',
  },
  sharedWorkspaces: {
    title: 'Shared Workspaces',
    description: 'Share projects and agents across your team with synchronized state.',
    requiredPlan: 'business',
  },
  launchpad: {
    title: 'Launchpad',
    description: 'A unified dashboard showing all pull requests and active agents across your entire team.',
    requiredPlan: 'business',
  },
  sso: {
    title: 'Single Sign-On',
    description: 'Authenticate with Google, GitHub, or SAML for enterprise-grade security.',
    requiredPlan: 'enterprise',
  },
  auditLog: {
    title: 'Audit Log',
    description: 'Full activity history — who did what, when, and on which project.',
    requiredPlan: 'enterprise',
  },
}

interface UpgradeGateProps {
  feature: keyof FeatureFlags
  children: React.ReactNode
  fallback?: React.ReactNode
}

const UpgradeGate: React.FC<UpgradeGateProps> = ({ feature, children, fallback }) => {
  if (hasFeature(feature)) {
    return React.createElement(React.Fragment, null, children)
  }

  if (fallback) {
    return React.createElement(React.Fragment, null, fallback)
  }

  const message = UPGRADE_MESSAGES[feature]
  const requiredPlan = message?.requiredPlan ?? 'pro'
  const planLabel = PLAN_LABELS[requiredPlan]

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '40px 32px',
      textAlign: 'center' as const,
      gap: '16px',
    },
  },
    // Lock icon
    React.createElement('div', {
      style: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        color: 'var(--text-tertiary)',
      },
    }, '\u{1F512}'),

    // Plan badge
    React.createElement('div', {
      style: {
        padding: '3px 10px',
        background: requiredPlan === 'business' ? '#6366f120' : 'var(--bg-elevated)',
        border: `1px solid ${requiredPlan === 'business' ? 'var(--accent)' : 'var(--border-default)'}`,
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 500,
        color: requiredPlan === 'business' ? 'var(--accent)' : 'var(--text-secondary)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
      },
    }, `${planLabel} feature`),

    // Title
    React.createElement('div', {
      style: {
        fontSize: '16px',
        fontWeight: 500,
        color: 'var(--text-primary)',
      },
    }, message?.title ?? 'Premium Feature'),

    // Description
    React.createElement('div', {
      style: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        maxWidth: '320px',
        lineHeight: '1.6',
      },
    }, message?.description ?? 'This feature requires a higher plan.'),

    // CTA button (placeholder — opens nothing until billing is implemented)
    React.createElement('button', {
      onClick: () => {
        // Will open pricing page when billing is implemented
      },
      style: {
        marginTop: '8px',
        padding: '9px 20px',
        background: 'var(--accent)',
        border: 'none',
        borderRadius: '6px',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'opacity 150ms',
      },
      onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '0.85' },
      onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = '1' },
    }, `Upgrade to ${planLabel}`)
  )
}

export default UpgradeGate
