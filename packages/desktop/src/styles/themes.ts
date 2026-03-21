export type Theme = 'dark' | 'dark-navy' | 'light' | 'system'

export const THEMES: Record<Exclude<Theme, 'system'>, Record<string, string>> = {
  'dark': {
    '--bg-app': '#0a0a0a',
    '--bg-surface': '#0f0f0f',
    '--bg-elevated': '#161616',
    '--bg-hover': '#1e1e1e',
    '--bg-selected': '#0d0d1f',
    '--border-subtle': '#1e1e1e',
    '--border-default': '#2e2e2e',
    '--border-strong': '#3e3e3e',
    '--text-primary': '#f0f0f0',
    '--text-secondary': '#a8a8a8',
    '--text-tertiary': '#707070',
    '--text-disabled': '#444444',
    '--accent': '#6366f1',
    '--accent-hover': '#818cf8',
    '--working': '#4ade80',
    '--waiting': '#fbbf24',
    '--done': '#818cf8',
    '--error': '#f87171',
  },
  'dark-navy': {
    '--bg-app': '#0d1117',
    '--bg-surface': '#161b22',
    '--bg-elevated': '#21262d',
    '--bg-hover': '#30363d',
    '--bg-selected': '#1a1f6e',
    '--border-subtle': '#21262d',
    '--border-default': '#30363d',
    '--border-strong': '#484f58',
    '--text-primary': '#e6edf3',
    '--text-secondary': '#8b949e',
    '--text-tertiary': '#656d76',
    '--text-disabled': '#3d444d',
    '--accent': '#6366f1',
    '--accent-hover': '#818cf8',
    '--working': '#3fb950',
    '--waiting': '#d29922',
    '--done': '#818cf8',
    '--error': '#f85149',
  },
  'light': {
    '--bg-app': '#ffffff',
    '--bg-surface': '#f6f8fa',
    '--bg-elevated': '#ffffff',
    '--bg-hover': '#f3f4f6',
    '--bg-selected': '#eef2ff',
    '--border-subtle': '#e5e7eb',
    '--border-default': '#d1d5db',
    '--border-strong': '#9ca3af',
    '--text-primary': '#111827',
    '--text-secondary': '#374151',
    '--text-tertiary': '#6b7280',
    '--text-disabled': '#9ca3af',
    '--accent': '#4f46e5',
    '--accent-hover': '#4338ca',
    '--working': '#16a34a',
    '--waiting': '#d97706',
    '--done': '#4f46e5',
    '--error': '#dc2626',
  },
}

export function applyTheme(theme: Theme): void {
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  const tokens = THEMES[resolvedTheme]
  const root = document.documentElement

  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  root.setAttribute('data-theme', resolvedTheme)
}
