import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import sitemap from './sitemap'

describe('sitemap', () => {
  it('includes the homepage and every standalone project page', () => {
    expect(sitemap().map(({ url }) => url)).toEqual([
      'https://bthaas.github.io/',
      ...siteContent.projects.map(({ id }) => `https://bthaas.github.io/projects/${id}`),
    ])
  })
})
