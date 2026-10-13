import { describe, expect, it } from 'vitest'

import {
  absoluteUrl,
  escapeMarkdown,
  joinMarkdown,
  markdownLink,
  renderBlock,
  renderInline,
} from './markdown'

describe('markdown helpers', () => {
  it('escapes structural characters without mangling ordinary prose', () => {
    expect(escapeMarkdown('a *b* _c_ [d] `e` \\f')).toBe('a \\*b\\* \\_c\\_ \\[d\\] \\`e\\` \\\\f')
    expect(escapeMarkdown('<script> and </b> but <200ms stays')).toBe(
      '\\<script> and \\</b> but <200ms stays',
    )
    expect(escapeMarkdown('C/C++, 616K+, AI / ML')).toBe('C/C++, 616K+, AI / ML')
  })

  it('resolves site-relative links against the canonical origin only', () => {
    expect(absoluteUrl('/about')).toBe('https://www.bretthaas.com/about')
    expect(absoluteUrl('mailto:someone@example.com')).toBe('mailto:someone@example.com')
    expect(absoluteUrl('https://github.com/bthaas')).toBe('https://github.com/bthaas')
  })

  it('renders safe link destinations', () => {
    expect(markdownLink('A [b]', '/x y)')).toBe('[A \\[b\\]](https://www.bretthaas.com/x%20y%29)')
  })

  it('renders inline runs, paragraphs, and lists', () => {
    const content = ['See ', { text: 'privacy', href: '/privacy' }, '.']
    expect(renderInline(content)).toBe('See [privacy](https://www.bretthaas.com/privacy).')
    expect(renderBlock({ kind: 'paragraph', content })).toBe(renderInline(content))
    expect(renderBlock({ kind: 'list', items: [['one'], ['two']] })).toBe('- one\n- two')
  })

  it('joins blocks with blank lines, skipping empty ones, and ends with a newline', () => {
    expect(joinMarkdown(['# Title', null, 'Body'])).toBe('# Title\n\nBody\n')
  })
})
