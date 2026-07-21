import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import nextConfig from './next.config'

describe('GitHub Pages export', () => {
  it('ships the hydrated Next.js runtime instead of stripping it after build', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      dependencies: Record<string, string>
      scripts: Record<string, string>
    }

    expect(packageJson.scripts).not.toHaveProperty('postbuild')
    expect(existsSync(resolve(process.cwd(), 'scripts/strip-static-runtime.mjs'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'scripts/strip-static-runtime.test.ts'))).toBe(false)
  })

  it('installs the React motion and WebGL foundation for hydrated showpieces', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> }

    expect(packageJson.dependencies).toMatchObject({
      '@gsap/react': expect.any(String),
      '@react-three/drei': expect.any(String),
      '@react-three/fiber': expect.any(String),
      three: expect.any(String),
    })
  })

  it('reserves a local source-owned home for vendored React Bits components', () => {
    const guide = readFileSync(
      resolve(process.cwd(), 'components/bits/README.md'),
      'utf8',
    )

    expect(guide).toContain('jsrepo')
    expect(guide).toContain('components/bits')
    expect(guide).toContain('TypeScript + CSS')
  })

  it('disables Jekyll processing so Next.js _next assets are served', () => {
    expect(existsSync(resolve(process.cwd(), 'public/.nojekyll'))).toBe(true)
  })

  it('uses a versioned asset prefix to bypass stale CDN 404 responses', () => {
    expect(nextConfig.assetPrefix).toBe('/static-v1')
  })

  it('keeps production CSS cacheable instead of duplicating it into every HTML route', () => {
    expect(nextConfig.experimental?.inlineCss).not.toBe(true)
  })

  it('copies generated Next.js assets into the prefixed deployment path', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/deploy.yml'), 'utf8')

    expect(workflow).toContain('cp -R out/_next out/static-v1/_next')
  })

  it('starts the Atlas enhancement after hydration without competing with LCP', () => {
    const layout = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8')

    expect(layout).toContain("import Script from 'next/script'")
    expect(layout).toContain('strategy="lazyOnload"')
    expect(layout).not.toContain('<script src="/atlas.js"')
  })

  it('keeps the Brett Haas page title unchanged when the tab loses visibility', () => {
    const layout = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8')

    expect(layout).not.toContain('TitleWink')
    expect(existsSync(resolve(process.cwd(), 'components/motion/TitleWink.tsx'))).toBe(false)
  })

  it('builds the contact horizon as an independent lazy asset', () => {
    const builder = readFileSync(resolve(process.cwd(), 'scripts/build-atlas.mjs'), 'utf8')

    expect(builder).toContain("entryPoints: ['src/horizon/index.ts']")
    expect(builder).toContain("outfile: 'public/horizon.js'")
    expect(builder).toContain('__ATLAS_HORIZON_SOURCE__')
  })
})
