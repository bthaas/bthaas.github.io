import { describe, expect, it } from 'vitest'

import sitemap from '@/app/sitemap'
import { SITE_URL } from '@/lib/site-config'

import { createAgentReadableFiles } from './index'
import { getMarkdownPath } from './markdown-paths'
import { requireMarkdownPath } from './registry'

describe('agent-readable files', () => {
  const files = createAgentReadableFiles()
  const paths = files.map(({ path }) => path)

  it('publishes llms.txt and a Markdown twin for every page in the sitemap', () => {
    const expected = sitemap().map(({ url }) => getMarkdownPath(new URL(url).pathname))

    expect(paths[0]).toBe('/llms.txt')
    expect([...paths.slice(1)].sort()).toEqual([...expected].sort())
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('renders each Markdown twin as a titled, non-trivial document', () => {
    for (const { path, content } of files.filter(({ path }) => path.endsWith('.md'))) {
      expect(content, path).toMatch(/^# \S/)
      expect(content, path).toMatch(/\n> \S/)
      expect(content.endsWith('\n'), path).toBe(true)
      expect(content.length, path).toBeGreaterThan(400)
    }
  })

  it('links only to pages that exist in the sitemap or to external profiles', () => {
    const pages = new Set(sitemap().map(({ url }) => url))
    const markdownPages = new Set(paths.map((path) => `${SITE_URL}${path}`))
    const siteFiles = new Set([`${SITE_URL}/sitemap.xml`, `${SITE_URL}/llms.txt`])

    for (const { path, content } of files) {
      for (const [, href] of content.matchAll(/\]\(([^)]+)\)/g)) {
        if (!href.startsWith(SITE_URL)) continue
        const known = pages.has(href) || markdownPages.has(href) || siteFiles.has(href)
          || href === `${SITE_URL}/nicotine/privacy/`
        expect(known, `${path} links to ${href}`).toBe(true)
      }
    }
  })

  it('refuses page paths that cannot have a Markdown twin', () => {
    expect(() => requireMarkdownPath('/sitemap.xml')).toThrow('No Markdown path')
  })
})
