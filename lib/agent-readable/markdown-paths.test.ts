import { describe, expect, it } from 'vitest'

import { getMarkdownPath, getPagePathForMarkdown, isMarkdownPath } from './markdown-paths'

describe('markdown paths', () => {
  it.each([
    ['/', '/index.html.md'],
    ['/experience', '/experience.md'],
    ['/projects/courtvision', '/projects/courtvision.md'],
    ['/nicotine/', '/nicotine/index.html.md'],
    ['/index.html', '/index.html.md'],
    ['/projects/index.html', '/projects/index.html.md'],
    ['/experience.html', '/experience.md'],
    ['/v1.2/page', '/v1.2/page.md'],
  ])('maps the page %s to its llms.txt-style Markdown twin %s', (page, markdown) => {
    expect(getMarkdownPath(page)).toBe(markdown)
  })

  it.each(['/static-v1/_next/app.js', '/sitemap.xml', '/llms.txt', '/experience.md', 'relative'])(
    'does not negotiate non-page path %s',
    (path) => {
      expect(getMarkdownPath(path)).toBeNull()
    },
  )

  it.each([
    ['/index.html.md', '/'],
    ['/nicotine/index.html.md', '/nicotine/'],
    ['/experience.md', '/experience'],
    ['/projects/courtvision.md', '/projects/courtvision'],
  ])('maps the Markdown file %s back to the page %s', (markdown, page) => {
    expect(isMarkdownPath(markdown)).toBe(true)
    expect(getPagePathForMarkdown(markdown)).toBe(page)
  })

  it('round-trips every page path', () => {
    for (const page of ['/', '/about', '/projects/beatstream', '/nicotine/']) {
      expect(getPagePathForMarkdown(getMarkdownPath(page) ?? '')).toBe(page)
    }
    expect(getPagePathForMarkdown('/llms.txt')).toBeNull()
  })
})
