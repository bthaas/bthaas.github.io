import type { MetadataRoute } from 'next'

import { siteContent } from '@/content/site-content'
import { SITE_URL } from '@/lib/site-config'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const sectionPages = ['experience', 'projects', 'skills', 'contact'].map((section) => ({
    url: `${SITE_URL}/${section}`,
    lastModified: new Date('2026-07-25'),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }))
  const projectPages = siteContent.projects.map(({ id }) => ({
    url: `${SITE_URL}/projects/${id}`,
    lastModified: new Date('2026-07-15'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date('2026-07-15'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...sectionPages,
    ...projectPages,
  ]
}
