import type { MetadataRoute } from 'next'

import { editorialDocuments } from '@/content/editorial-documents'
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
  const documentPages = editorialDocuments.map(({ path }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date('2026-10-12'),
    changeFrequency: 'yearly' as const,
    priority: 0.5,
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
    ...documentPages,
  ]
}
