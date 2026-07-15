import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// @ts-expect-error The postbuild script is intentionally native ESM JavaScript.
import { assertAtlasBudget, processStaticExport, stripStaticRuntime } from './strip-static-runtime.mjs'

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

  it('enforces the inclusive 12 KiB gzip ceiling', () => {
    expect(() => assertAtlasBudget(12 * 1024)).not.toThrow()
    expect(() => assertAtlasBudget(12 * 1024 + 1)).toThrow(/12 KiB/)
  })

  it('processes every exported HTML file and reports the Atlas budget', async () => {
    const root = await mkdtemp(join(tmpdir(), 'atlas-postbuild-'))
    const nested = join(root, 'nested')
    const atlasPath = join(root, 'atlas.js')
    await mkdir(nested)
    await writeFile(atlasPath, 'document.documentElement.dataset.atlas="ready"')
    await writeFile(join(root, 'index.html'), '<script src="/atlas.js"></script><script>next()</script>')
    await writeFile(join(nested, 'page.html'), '<script src="/_next/runtime.js"></script>')
    await writeFile(join(root, 'robots.txt'), 'User-agent: *')

    try {
      const result = await processStaticExport(root, atlasPath)

      expect(result.htmlFiles).toHaveLength(2)
      expect(result.gzipBytes).toBeGreaterThan(0)
      expect(await readFile(join(root, 'index.html'), 'utf8')).toBe(
        '<script src="/atlas.js"></script>',
      )
      expect(await readFile(join(nested, 'page.html'), 'utf8')).toBe(
        '<script src="/atlas.js" defer></script>',
      )
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})
