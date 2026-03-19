import * as esbuild from 'esbuild'

// Build main process
await esbuild.build({
  entryPoints: ['electron/main.ts'],
  bundle: true,
  outfile: 'dist/electron/main.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['electron', 'node-pty'],
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
  },
  sourcemap: true,
})

console.log('Build complete: main + preload + renderer')
