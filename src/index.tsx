#!/usr/bin/env node
import * as React from 'react'
import { render, Text, Box } from 'ink'
import * as path from 'path'
import { simpleGit } from 'simple-git'
import App from './App.js'

async function main() {
  const cwd = process.cwd()
  const git = simpleGit(cwd)

  // Verify we're in a git repo
  let rootPath: string
  try {
    const toplevel = await git.revparse(['--show-toplevel'])
    rootPath = path.normalize(toplevel.trim())
  } catch {
    render(
      React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(
          Text,
          { color: 'red' },
          'Erro: não é um repositório git.'
        ),
        React.createElement(
          Text,
          { dimColor: true },
          'Execute agentflow dentro de um repositório git.'
        )
      )
    )
    process.exit(1)
    return
  }

  render(React.createElement(App, { rootPath }))
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
