import { describe, expect, it } from 'vitest'

import {
  aboutDocument,
  type EditorialDocument,
  editorialDocuments,
  getInlinePlainText,
  privacyDocument,
} from './editorial-documents'
import { siteContent } from './site-content'

function plainText(document: EditorialDocument): string {
  return [
    document.title,
    document.lede,
    ...document.sections.flatMap((section) => [
      section.heading,
      ...section.blocks.flatMap((block) => (
        block.kind === 'paragraph'
          ? [getInlinePlainText(block.content)]
          : block.items.map(getInlinePlainText)
      )),
    ]),
  ].join(' ')
}

describe('editorial documents', () => {
  it.each(editorialDocuments.map((document) => [document.path, document] as const))(
    '%s carries substantial content with unique section ids',
    (_path, document) => {
      const ids = document.sections.map(({ id }) => id)

      expect(plainText(document).length).toBeGreaterThan(1500)
      expect(new Set(ids).size).toBe(ids.length)
    },
  )

  it('builds the About page from the portfolio source of truth', () => {
    const text = plainText(aboutDocument)

    expect(aboutDocument.updated).toBeNull()
    for (const { organization, period } of siteContent.experience) {
      expect(text).toContain(organization)
      expect(text).toContain(period)
    }
    for (const { name } of siteContent.projects) expect(text).toContain(name)
    expect(text).toContain('B.S. in Computer Science')
  })

  it('states the privacy facts verified in the site code and hosting setup', () => {
    const text = plainText(privacyDocument)

    expect(privacyDocument.updated).toBe('October 12, 2026')
    expect(text).toContain('does not set cookies')
    expect(text).toContain('session storage')
    expect(text).toContain('Cloudflare')
    expect(text).toContain('GitHub Pages')
    expect(text).toContain(siteContent.contact.email)
  })

  it('flattens inline links to their text', () => {
    expect(getInlinePlainText(['Read the ', { text: 'policy', href: '/privacy' }, '.']))
      .toBe('Read the policy.')
  })
})
