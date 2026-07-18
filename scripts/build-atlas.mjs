import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

await build({
  bundle: true,
  entryPoints: ['src/horizon/index.ts'],
  format: 'iife',
  logLevel: 'info',
  minify: true,
  outfile: 'public/horizon.js',
  platform: 'browser',
  sourcemap: false,
  target: ['es2020'],
})

const horizonSource = await readFile('public/horizon.js')
const horizonVersion = createHash('sha256').update(horizonSource).digest('hex').slice(0, 12)

await build({
  bundle: true,
  entryPoints: ['src/atlas/index.ts'],
  define: {
    __ATLAS_HORIZON_SOURCE__: JSON.stringify(`/horizon.js?v=${horizonVersion}`),
  },
  format: 'iife',
  logLevel: 'info',
  minify: true,
  outfile: 'public/atlas.js',
  platform: 'browser',
  sourcemap: false,
  target: ['es2020'],
})
