// Copyright (c) 2026 Runnio. All rights reserved. Proprietary and confidential.

import { useMemo } from 'react'

const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript',
  js: 'javascript', jsx: 'javascript',
  py: 'python', css: 'css',
  json: 'json', md: 'markdown',
  sh: 'bash', bash: 'bash',
  html: 'xml', htm: 'xml',
  rs: 'rust', go: 'go',
  rb: 'ruby', java: 'java',
  c: 'c', cpp: 'cpp', h: 'cpp',
  yaml: 'yaml', yml: 'yaml',
  toml: 'ini', env: 'bash',
}

export function detectLanguage(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  return LANGUAGE_MAP[ext ?? ''] ?? null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Lazy-loaded hljs instance
let hljsCore: any = null
const registeredLanguages = new Set<string>()

function getHljs(): any {
  if (hljsCore) return hljsCore
  try {
    hljsCore = require('highlight.js/lib/core')
    return hljsCore
  } catch {
    return null
  }
}

function ensureLanguage(hljs: any, language: string): boolean {
  if (registeredLanguages.has(language)) return true
  try {
    const registrations: Record<string, () => any> = {
      typescript: () => require('highlight.js/lib/languages/typescript'),
      javascript: () => require('highlight.js/lib/languages/javascript'),
      python: () => require('highlight.js/lib/languages/python'),
      css: () => require('highlight.js/lib/languages/css'),
      json: () => require('highlight.js/lib/languages/json'),
      markdown: () => require('highlight.js/lib/languages/markdown'),
      bash: () => require('highlight.js/lib/languages/bash'),
      xml: () => require('highlight.js/lib/languages/xml'),
      rust: () => require('highlight.js/lib/languages/rust'),
      go: () => require('highlight.js/lib/languages/go'),
      ruby: () => require('highlight.js/lib/languages/ruby'),
      java: () => require('highlight.js/lib/languages/java'),
      c: () => require('highlight.js/lib/languages/c'),
      cpp: () => require('highlight.js/lib/languages/cpp'),
      yaml: () => require('highlight.js/lib/languages/yaml'),
      ini: () => require('highlight.js/lib/languages/ini'),
    }
    const loader = registrations[language]
    if (!loader) return false
    hljs.registerLanguage(language, loader())
    registeredLanguages.add(language)
    return true
  } catch {
    return false
  }
}

export function highlightCode(code: string, filename: string): string {
  const language = detectLanguage(filename)
  if (!language) return escapeHtml(code)

  const hljs = getHljs()
  if (!hljs) return escapeHtml(code)

  if (!ensureLanguage(hljs, language)) return escapeHtml(code)

  try {
    return hljs.highlight(code, { language }).value
  } catch {
    return escapeHtml(code)
  }
}

export function useHighlightedCode(code: string, filename: string): string {
  return useMemo(() => highlightCode(code, filename), [code, filename])
}

export const SYNTAX_THEME_CSS = `
.hljs { background: transparent; color: var(--text-primary); }
.hljs-keyword, .hljs-selector-tag { color: #c792ea; }
.hljs-string, .hljs-attr { color: #c3e88d; }
.hljs-number, .hljs-literal { color: #f78c6c; }
.hljs-comment { color: var(--text-tertiary); font-style: italic; }
.hljs-title, .hljs-function .hljs-title { color: #82aaff; }
.hljs-type, .hljs-class .hljs-title { color: #ffcb6b; }
.hljs-built_in { color: #89ddff; }
.hljs-variable { color: var(--text-primary); }
.hljs-tag { color: #f07178; }
.hljs-meta { color: var(--text-tertiary); }
`
