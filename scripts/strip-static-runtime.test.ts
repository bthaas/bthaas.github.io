import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// @ts-expect-error The postbuild script is intentionally native ESM JavaScript.
import * as staticRuntime from './strip-static-runtime.mjs'

const {
  assertAtlasBudget,
  getAtlasScriptSource,
  processStaticExport,
  stripStaticRuntime,
} = staticRuntime

describe('static runtime stripping', () => {
  it('preserves only the Atlas enhancement script', () => {
    const html = [
      '<link rel="preload" as="script" href="/static-v1/_next/runtime.js" />',
      '<script src="/atlas.js" defer></script>',
      '<script src="/static-v1/_next/runtime.js"></script>',
      '<script>self.__next_f.push([])</script>',
    ].join('')

    const stripped = stripStaticRuntime(html)

    expect(stripped.match(/<script/g)).toHaveLength(1)
    expect(stripped).toContain('<script src="/atlas.js" defer></script>')
    expect(stripped).not.toContain('/_next/runtime.js')
  })

  it('injects one deferred Atlas script when Next schedules it through its runtime', () => {
    const html = '<html><body><main>Portfolio</main><script>self.__next_s.push([])</script></body></html>'

    const stripped = stripStaticRuntime(html)

    expect(stripped.match(/<script/g)).toHaveLength(1)
    expect(stripped).toContain('<script src="/atlas.js" defer></script></body>')
  })

  it('rewrites Atlas to a content-versioned source', () => {
    const firstSource = getAtlasScriptSource('first build')
    const secondSource = getAtlasScriptSource('second build')
    const html = '<script src="/atlas.js" defer></script><script>next()</script>'

    expect(firstSource).toMatch(/^\/atlas\.js\?v=[a-f0-9]{12}$/)
    expect(secondSource).not.toBe(firstSource)
    expect(stripStaticRuntime(html, firstSource)).toBe(
      `<script src="${firstSource}" defer></script>`,
    )
  })

  it('enforces the inclusive 12 KiB gzip ceiling', () => {
    expect(() => assertAtlasBudget(12 * 1024)).not.toThrow()
    expect(() => assertAtlasBudget(12 * 1024 + 1)).toThrow(/12 KiB/)
  })

  it('processes every exported HTML file and reports the Atlas budget', async () => {
    const root = await mkdtemp(join(tmpdir(), 'atlas-postbuild-'))
    const nested = join(root, 'nested')
    const atlasPath = join(root, 'atlas.js')
    await mkdir(nested)
    const atlasSource = 'document.documentElement.dataset.atlas="ready"'
    const versionedAtlasSource = getAtlasScriptSource(atlasSource)
    await writeFile(atlasPath, atlasSource)
    await writeFile(join(root, 'index.html'), '<script src="/atlas.js"></script><script>next()</script>')
    await writeFile(join(nested, 'page.html'), '<script src="/_next/runtime.js"></script>')
    await writeFile(join(root, 'robots.txt'), 'User-agent: *')

    try {
      const result = await processStaticExport(root, atlasPath)

      expect(result.htmlFiles).toHaveLength(2)
      expect(result.gzipBytes).toBeGreaterThan(0)
      expect(await readFile(join(root, 'index.html'), 'utf8')).toBe(
        `<script src="${versionedAtlasSource}"></script>`,
      )
      expect(await readFile(join(nested, 'page.html'), 'utf8')).toBe(
        `<script src="${versionedAtlasSource}" defer></script>`,
      )
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})
