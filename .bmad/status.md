# Regent — Status BMAD

## Fase atual
MVP v0.1.1 — estabilização e features core

## Prioridades desta fase
1. Init prompt timing (injetar após Claude Code estar pronto)
2. Worktree sync externo (detectar worktrees criados fora do app)
3. Broadcast para múltiplos agentes
4. PR flow real com GitHub API
5. MCP panel como gerenciador do Claude Code
6. Settings modal
7. UX/UI polish geral

## Arquitetura
Monorepo pnpm: core (lógica compartilhada) + tui (terminal) + desktop (Electron)

## Stack desktop
Electron 28 + React 18 + TypeScript + Zustand + xterm.js + node-pty + esbuild

## Última atualização
2026-03-19
