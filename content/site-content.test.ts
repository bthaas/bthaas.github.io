import { describe, expect, it } from 'vitest'

import { siteContent } from './site-content'

describe('siteContent', () => {
  it('preserves every current project and its repository link', () => {
    expect(siteContent.projects.map(({ id }) => id)).toEqual([
      'courtvision',
      'beatstream',
      'vision-bias-steering',
    ])

    for (const project of siteContent.projects) {
      expect(project.links.repository).toMatch(/^https:\/\/github\.com\/bthaas\//)
      expect(project.description.length).toBeGreaterThan(20)
      expect(project.technologies.length).toBeGreaterThan(0)
    }
  })

  it('preserves the current experience and education details', () => {
    expect(siteContent.experience.map(({ organization }) => organization)).toEqual([
      'University of Virginia',
      'Scale AI',
      'Refraction Innovation Hub',
    ])
    expect(siteContent.education).toHaveLength(1)
    expect(siteContent.education[0]?.gpa).toBe('3.7')
  })

  it('keeps contact destinations and missing resume state explicit', () => {
    expect(siteContent.contact.email).toBe('bthaas15@gmail.com')
    expect(siteContent.contact.github).toBe('https://github.com/bthaas')
    expect(siteContent.contact.linkedin).toBe('https://linkedin.com/in/brett-haas')
    expect(siteContent.contact.resume).toBeNull()
  })

  it('records each reusable local asset', () => {
    expect(siteContent.assets.every(({ path }) => path.startsWith('/assets/'))).toBe(true)
    expect(siteContent.assets).toHaveLength(8)
  })
})
