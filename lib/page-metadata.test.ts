import { describe, expect, it } from 'vitest'

import { getPageAlternates } from './page-metadata'

describe('getPageAlternates', () => {
  it('pairs page URLs with their Markdown twin', () => {
    expect(getPageAlternates('/')).toEqual({
      canonical: '/',
      types: { 'text/markdown': '/index.html.md' },
    })
    expect(getPageAlternates('/projects/courtvision')).toEqual({
      canonical: '/projects/courtvision',
      types: { 'text/markdown': '/projects/courtvision.md' },
    })
  })

  it('omits the Markdown alternate for non-page resources', () => {
    expect(getPageAlternates('/sitemap.xml')).toEqual({ canonical: '/sitemap.xml' })
  })
})
