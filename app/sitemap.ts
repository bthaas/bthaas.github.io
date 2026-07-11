import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://bthaas.github.io/',
      lastModified: new Date('2026-07-11'),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
