import { describe, expect, it } from 'vitest'

import { parseAccept, selectRepresentation } from './content-negotiation'

const BOTH = ['html', 'markdown'] as const

describe('parseAccept', () => {
  it('treats an absent, empty, or entirely malformed header as no preference', () => {
    expect(parseAccept(null)).toBeNull()
    expect(parseAccept('')).toBeNull()
    expect(parseAccept('garbage, also/garbage/extra')).toBeNull()
  })

  it('parses media ranges case-insensitively with default and explicit q-values', () => {
    expect(parseAccept('Text/Markdown, text/html;q=0.8, */*;Q=0.1')).toEqual([
      { type: 'text', subtype: 'markdown', q: 1 },
      { type: 'text', subtype: 'html', q: 0.8 },
      { type: '*', subtype: '*', q: 0.1 },
    ])
  })

  it('drops ranges with invalid q-values or invalid wildcards', () => {
    expect(parseAccept('text/markdown;q=2, text/html;q=abc, */html, text/plain;q=0.5')).toEqual([
      { type: 'text', subtype: 'plain', q: 0.5 },
    ])
  })
})

describe('selectRepresentation', () => {
  it.each([
    [null, 'html'],
    ['*/*', 'html'],
    ['text/*', 'html'],
    ['text/html', 'html'],
    ['text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'html'],
    ['text/markdown', 'markdown'],
    ['text/markdown, text/html;q=0.8, */*;q=0.1', 'markdown'],
    ['text/html, text/markdown;q=0.5', 'html'],
    ['text/markdown;q=0.5, text/html;q=0.9', 'html'],
    ['text/markdown, text/html', 'markdown'],
    ['text/markdown;q=0, text/html', 'html'],
    ['text/markdown;q=0, */*', 'html'],
    ['text/markdown;variant=GFM;charset=utf-8', 'markdown'],
    ['text/*;q=0.5, text/markdown;q=0.4', 'html'],
  ] as const)('serves the best representation for Accept %j', (accept, expected) => {
    expect(selectRepresentation(accept, BOTH)).toBe(expected)
  })

  it('lets the most specific range decide even when a wildcard has a higher q', () => {
    expect(selectRepresentation('text/markdown;q=0.2, */*', BOTH)).toBe('html')
    expect(selectRepresentation('text/html;q=0, */*', BOTH)).toBe('markdown')
  })

  it('keeps the higher q-value when the same exact type is listed twice', () => {
    expect(selectRepresentation('text/markdown;q=0.1, text/markdown, text/html;q=0.5', BOTH))
      .toBe('markdown')
  })

  it('returns null when nothing available is acceptable', () => {
    expect(selectRepresentation('application/pdf', BOTH)).toBeNull()
    expect(selectRepresentation('text/html;q=0, text/markdown;q=0', BOTH)).toBeNull()
    expect(selectRepresentation('text/markdown', ['html'])).toBeNull()
  })

  it('falls back to the only available representation without a preference', () => {
    expect(selectRepresentation(null, ['markdown'])).toBe('markdown')
    expect(selectRepresentation(null, [])).toBeNull()
  })
})
