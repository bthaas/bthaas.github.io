import { build } from 'esbuild'

await build({
  bundle: true,
  entryPoints: ['src/atlas/index.ts'],
  format: 'iife',
  logLevel: 'info',
  minify: true,
  outfile: 'public/atlas.js',
  platform: 'browser',
  sourcemap: false,
  target: ['es2020'],
})
