import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import { renderLlmsTxt } from './llms-txt'

const FILE_LIST_ITEM = /^- \[[^\]]+\]\((https?:\/\/[^)\s]+)\)(?:: .+)?$/

describe('llms.txt', () => {
  const text = renderLlmsTxt()
  const lines = text.split('\n')
  const firstH2 = lines.findIndex((line) => line.startsWith('## '))

  it('opens with the required H1 followed by a blockquote summary', () => {
    expect(lines[0]).toBe('# Brett Haas')
    expect(lines[1]).toBe('')
    expect(lines[2]).toMatch(/^> Brett Haas is a software engineer/)
    expect(lines.filter((line) => line.startsWith('# '))).toHaveLength(1)
  })

  it('keeps the detail section free of headings and gives agents when-to-use guidance', () => {
    const details = lines.slice(3, firstH2).join('\n')

    expect(details).not.toMatch(/^#{1,6} /m)
    expect(details).toContain('**When to use this site.**')
    expect(details).toContain('**When not to use it.**')
    expect(details).toContain('`Accept: text/markdown`')
    expect(details).toContain(`mailto:${siteContent.contact.email}`)
    for (const { name } of siteContent.projects) expect(details).toContain(name)
  })

  it('uses only H2 file lists after the details, ending with Optional', () => {
    const sections = lines.slice(firstH2).filter((line) => line.startsWith('#'))

    expect(sections).toEqual(['## Portfolio', '## Projects', '## Policies', '## Optional'])
    for (const line of lines.slice(firstH2)) {
      if (line === '' || line.startsWith('## ')) continue
      expect(line).toMatch(FILE_LIST_ITEM)
    }
  })

  it('links the Markdown twin of every page', () => {
    expect(text).toContain('(https://www.bretthaas.com/index.html.md)')
    expect(text).toContain('(https://www.bretthaas.com/about.md)')
    expect(text).toContain('(https://www.bretthaas.com/privacy.md)')
    for (const { id } of siteContent.projects) {
      expect(text).toContain(`(https://www.bretthaas.com/projects/${id}.md)`)
    }
  })
})
