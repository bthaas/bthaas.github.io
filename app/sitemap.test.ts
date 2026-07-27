import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import sitemap from './sitemap'

describe('sitemap', () => {
  it('includes the homepage, section screens, and every standalone project page', () => {
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://www.bretthaas.com/',
      'https://www.bretthaas.com/experience',
      'https://www.bretthaas.com/projects',
      'https://www.bretthaas.com/skills',
      'https://www.bretthaas.com/contact',
      ...siteContent.projects.map(({ id }) => `https://www.bretthaas.com/projects/${id}`),
    ])
  })
})
