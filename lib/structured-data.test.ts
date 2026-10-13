import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import {
  buildAboutJsonLd,
  buildHomeJsonLd,
  buildPersonJsonLd,
  PERSON_ID,
  serializeJsonLd,
  WEBSITE_ID,
} from './structured-data'

describe('structured data', () => {
  it('describes Brett Haas as a Person with contact point and postal address', () => {
    expect(buildPersonJsonLd()).toMatchObject({
      '@type': 'Person',
      '@id': PERSON_ID,
      name: 'Brett Haas',
      url: 'https://www.bretthaas.com/',
      jobTitle: 'Software Engineer',
      email: `mailto:${siteContent.contact.email}`,
      sameAs: [siteContent.contact.github, siteContent.contact.linkedin],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Bellevue',
        addressRegion: 'WA',
        addressCountry: 'US',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'professional inquiries',
        email: siteContent.contact.email,
        url: 'https://www.bretthaas.com/contact',
      },
      alumniOf: [{ '@type': 'CollegeOrUniversity', name: 'University of Virginia' }],
    })
  })

  it('lists knowledge areas without duplicates', () => {
    const { knowsAbout } = buildPersonJsonLd() as { knowsAbout: string[] }

    expect(knowsAbout).toContain('Machine Learning')
    expect(knowsAbout).toContain('LLM Evaluation')
    expect(new Set(knowsAbout).size).toBe(knowsAbout.length)
  })

  it('links the homepage WebSite to the Person through @id references', () => {
    const graph = buildHomeJsonLd()['@graph'] as Array<Record<string, unknown>>

    expect(buildHomeJsonLd()['@context']).toBe('https://schema.org')
    expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'Person'])
    expect(graph[0]).toMatchObject({
      '@id': WEBSITE_ID,
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
    })
  })

  it('marks the About page as a ProfilePage whose main entity is the Person', () => {
    const graph = buildAboutJsonLd()['@graph'] as Array<Record<string, unknown>>

    expect(graph[0]).toMatchObject({
      '@type': 'ProfilePage',
      url: 'https://www.bretthaas.com/about',
      mainEntity: { '@id': PERSON_ID },
      isPartOf: { '@id': WEBSITE_ID },
    })
  })

  it('serializes to valid JSON that cannot terminate an inline script', () => {
    const serialized = serializeJsonLd({ text: '</script><b>&\u2028\u2029' })

    expect(serialized).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(serialized)).toEqual({ text: '</script><b>&\u2028\u2029' })
  })
})
