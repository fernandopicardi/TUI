#!/usr/bin/env node
import * as React from 'react'
import { render, Text, Box } from 'ink'
import { getRepoRoot, loadConfig } from '@regent/core'
import App from './App.js'

async function main() {
  const cwd = process.cwd()

  // Find git repo root
  const rootPath = await getRepoRoot(cwd)
  if (!rootPath) {
    render(
      React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(Text, { bold: true, color: 'cyan' }, '\u2B21 Regent'),
        React.createElement(Text, null, ''),
        React.createElement(Text, { color: 'red' }, 'Nenhum reposit\u00F3rio git encontrado neste diret\u00F3rio.'),
        React.createElement(Text, { dimColor: true }, 'Execute Regent dentro de um reposit\u00F3rio git.'),
        React.createElement(Text, { dimColor: true }, `Diret\u00F3rio atual: ${cwd}`)
      )
    )
    process.exit(1)
    return
  }

  // Load config
  const config = await loadConfig(rootPath)

  render(React.createElement(App, { rootPath, config }))
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
