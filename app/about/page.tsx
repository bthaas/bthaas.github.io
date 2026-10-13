import type { Metadata } from 'next'

import { EditorialDocumentPage } from '@/components/portfolio/EditorialDocumentPage'
import { StructuredData } from '@/components/seo/StructuredData'
import { aboutDocument } from '@/content/editorial-documents'
import { getPageAlternates } from '@/lib/page-metadata'
import { buildAboutJsonLd } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: aboutDocument.metaTitle,
  description: aboutDocument.description,
  alternates: getPageAlternates(aboutDocument.path),
  openGraph: {
    title: aboutDocument.metaTitle,
    description: aboutDocument.description,
    url: aboutDocument.path,
    siteName: 'Brett Haas',
    images: [{ url: '/icarus-atlas/hero-social-1600.webp', width: 1600, height: 900 }],
    type: 'profile',
  },
}

export default function AboutPage() {
  return (
    <>
      <StructuredData data={buildAboutJsonLd()} />
      <EditorialDocumentPage document={aboutDocument} />
    </>
  )
}
