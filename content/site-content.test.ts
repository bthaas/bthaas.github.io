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
      expect(project.visualKey).toBe(project.id)
      expect(project.caseStudy.brief.length).toBeGreaterThan(20)
      expect(project.caseStudy.approach.length).toBeGreaterThan(20)
      expect(project.caseStudy.focus.length).toBeGreaterThan(20)
      expect(project.metrics.length).toBeGreaterThanOrEqual(2)
      expect(project.metrics.every(({ value, label }) => value.length > 0 && label.length > 8)).toBe(
        true,
      )
    }
  })

  it('keeps resume-verified metrics attached to the matching projects', () => {
    expect(siteContent.projects.map(({ metrics }) => metrics.map(({ value }) => value))).toEqual([
      ['89%', '<200ms'],
      ['20+', '<100ms'],
      ['616K+', '28.9%', '<0.1%'],
    ])
  })

  it('preserves the current experience and education details', () => {
    expect(siteContent.experience.map(({ organization }) => organization)).toEqual([
      'University of Virginia',
      'Scale AI',
      'Refraction Innovation Hub',
    ])
    expect(siteContent.education).toHaveLength(1)
    expect(siteContent.experience[0]?.location).toBe('Charlottesville, VA')
    expect(siteContent.experience[1]?.location).toBe('Remote')
    expect(siteContent.education[0]).toMatchObject({
      location: 'Charlottesville, VA',
      gpa: '3.7',
      coursework: [
        'Computer Systems',
        'Data Structures and Algorithms',
        'Software Engineering',
        'Cybersecurity',
        'Machine Learning',
        'Reinforcement Learning',
      ],
    })
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

  it('maps the about fragments to content that actually exists', () => {
    expect(siteContent.about.map(({ label }) => label)).toEqual([
      'AI Research',
      'Scale AI',
      'Refraction',
      'Projects',
      'UVA · CS',
    ])
    expect(siteContent.about.some(({ label }) => String(label) === 'Amazon')).toBe(false)
    expect(siteContent.about.every(({ detail }) => detail.length > 30)).toBe(true)
  })

  it('keeps the ending copy to the requested closing line only', () => {
    expect(siteContent.editorial).toEqual({ closingLine: 'Connect with me.' })
  })
})
