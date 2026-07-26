import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import sitemap from './sitemap'

describe('sitemap', () => {
  it('includes the homepage, section screens, and every standalone project page', () => {
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://bthaas.github.io/',
      'https://bthaas.github.io/experience',
      'https://bthaas.github.io/projects',
      'https://bthaas.github.io/skills',
      'https://bthaas.github.io/contact',
      ...siteContent.projects.map(({ id }) => `https://bthaas.github.io/projects/${id}`),
    ])
  })
})
