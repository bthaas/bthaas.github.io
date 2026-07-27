import { describe, expect, it } from 'vitest'

import { metadata as contactMetadata } from './contact/page'
import { metadata as experienceMetadata } from './experience/page'
import { metadata as rootMetadata } from './layout'
import { metadata as projectsMetadata } from './projects/page'
import robots from './robots'
import { metadata as skillsMetadata } from './skills/page'

describe('site metadata', () => {
  it('uses the custom domain as the canonical site origin', () => {
    expect(rootMetadata.metadataBase?.toString()).toBe('https://www.bretthaas.com/')
    expect(robots().sitemap).toBe('https://www.bretthaas.com/sitemap.xml')
  })

  it.each([
    ['contact', contactMetadata],
    ['experience', experienceMetadata],
    ['projects', projectsMetadata],
    ['skills', skillsMetadata],
  ])('publishes the canonical path for %s', (path, metadata) => {
    expect(metadata.alternates?.canonical).toBe(`/${path}`)
  })
})
