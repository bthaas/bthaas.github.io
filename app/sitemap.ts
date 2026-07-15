import type { MetadataRoute } from 'next'

import { siteContent } from '@/content/site-content'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const projectPages = siteContent.projects.map(({ id }) => ({
    url: `https://bthaas.github.io/projects/${id}`,
    lastModified: new Date('2026-07-15'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://bthaas.github.io/',
      lastModified: new Date('2026-07-15'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...projectPages,
  ]
}
