import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'

// Build main process
await esbuild.build({
  entryPoints: ['electron/main.ts'],
  bundle: true,
  outfile: 'dist/electron/main.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['electron', 'node-pty', '@runnio/core'],
  sourcemap: true,
})

// Build preload (runs in node context but sandboxed)
await esbuild.build({
  entryPoints: ['electron/preload.ts'],
  bundle: true,
  outfile: 'dist/electron/preload.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['electron'],
  sourcemap: true,
})

// Build renderer (runs in browser context)
await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/renderer.js',
  platform: 'browser',
  target: 'chrome120',
  format: 'iife',
  define: {
    'process.env.NODE_ENV': '"production"',
    '__RUNNIO_DEV__': JSON.stringify(process.env.RUNNIO_DEV ?? 'false'),
  },
  sourcemap: true,
})

// Copy xterm CSS to dist — supports both scoped (@xterm/xterm) and legacy (xterm) package paths
try {
  const candidates = [
    path.resolve('node_modules/@xterm/xterm/css/xterm.css'),
    path.resolve('node_modules/xterm/css/xterm.css'),
    // pnpm hoisted locations
    path.resolve('../../node_modules/.pnpm/@xterm+xterm@5.5.0/node_modules/@xterm/xterm/css/xterm.css'),
    path.resolve('../../node_modules/.pnpm/xterm@5.3.0/node_modules/xterm/css/xterm.css'),
  ]
  const found = candidates.find(p => fs.existsSync(p))
  if (found) {
    fs.copyFileSync(found, 'dist/xterm.css')
    console.log('xterm.css copied to dist/')
  } else {
    // Try to find it dynamically via glob-like search in pnpm store
    const pnpmDir = path.resolve('../../node_modules/.pnpm')
    if (fs.existsSync(pnpmDir)) {
      const dirs = fs.readdirSync(pnpmDir).filter(d => d.startsWith('@xterm+xterm@'))
      if (dirs.length > 0) {
        const cssPath = path.join(pnpmDir, dirs[0], 'node_modules/@xterm/xterm/css/xterm.css')
        if (fs.existsSync(cssPath)) {
          fs.copyFileSync(cssPath, 'dist/xterm.css')
          console.log('xterm.css copied to dist/ (from pnpm store)')
        }
      }
    }
  }
} catch (e) {
  console.warn('Warning: could not copy xterm.css:', e.message)
}

console.log('Build complete: main + preload + renderer')
