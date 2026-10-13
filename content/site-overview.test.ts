import { describe, expect, it } from 'vitest'

import { siteContent } from './site-content'
import { joinNames, siteOverview } from './site-overview'

describe('site overview', () => {
  it('joins names as readable English lists', () => {
    expect(joinNames([])).toBe('')
    expect(joinNames(['A'])).toBe('A')
    expect(joinNames(['A', 'B'])).toBe('A and B')
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B, and C')
  })

  it('summarizes the four portfolio sections from the site content', () => {
    expect(siteOverview.sections.map(({ path }) => path)).toEqual([
      '/experience',
      '/projects',
      '/skills',
      '/contact',
    ])
    const [experience, projects] = siteOverview.sections
    for (const { organization } of siteContent.experience) {
      expect(experience.description).toContain(organization)
    }
    for (const { name } of siteContent.projects) expect(projects.description).toContain(name)
    expect(projects.description).toContain('LLM steering experiments')
  })

  it('provides enough plain text for readers without JavaScript or vision', () => {
    const text = [
      siteOverview.summary,
      siteOverview.scope,
      ...siteOverview.sections.map(({ description }) => description),
    ].join(' ')

    expect(siteOverview.summary).toContain('Bellevue, Washington, building')
    expect(text.length).toBeGreaterThan(1200)
  })
})
