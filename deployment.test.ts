import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import nextConfig from './next.config'

describe('GitHub Pages export', () => {
  it('disables Jekyll processing so Next.js _next assets are served', () => {
    expect(existsSync(resolve(process.cwd(), 'public/.nojekyll'))).toBe(true)
  })

  it('uses a versioned asset prefix to bypass stale CDN 404 responses', () => {
    expect(nextConfig.assetPrefix).toBe('/static-v1')
  })

  it('copies generated Next.js assets into the prefixed deployment path', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/deploy.yml'), 'utf8')

    expect(workflow).toContain('cp -R out/_next out/static-v1/_next')
  })

  it('starts the Atlas enhancement only after React hydration', () => {
    const layout = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8')

    expect(layout).toContain("import Script from 'next/script'")
    expect(layout).toContain('strategy="afterInteractive"')
    expect(layout).not.toContain('<script src="/atlas.js"')
  })

  it('builds the contact horizon as an independent lazy asset', () => {
    const builder = readFileSync(resolve(process.cwd(), 'scripts/build-atlas.mjs'), 'utf8')

    expect(builder).toContain("entryPoints: ['src/horizon/index.ts']")
    expect(builder).toContain("outfile: 'public/horizon.js'")
    expect(builder).toContain('__ATLAS_HORIZON_SOURCE__')
  })
})
