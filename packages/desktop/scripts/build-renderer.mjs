import * as esbuild from 'esbuild'

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
  external: [],
  minify: false,
  sourcemap: true,
})

console.log('Renderer bundled successfully.')
