import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import sitemap from './sitemap'

describe('sitemap', () => {
  it('includes the homepage, section screens, every project page, and the trust pages', () => {
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://www.bretthaas.com/',
      'https://www.bretthaas.com/experience',
      'https://www.bretthaas.com/projects',
      'https://www.bretthaas.com/skills',
      'https://www.bretthaas.com/contact',
      ...siteContent.projects.map(({ id }) => `https://www.bretthaas.com/projects/${id}`),
      'https://www.bretthaas.com/about',
      'https://www.bretthaas.com/privacy',
    ])
  })
})
