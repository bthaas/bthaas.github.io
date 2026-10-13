import type { Metadata } from 'next'

import { Portfolio } from '@/components/portfolio/Portfolio'
import { StructuredData } from '@/components/seo/StructuredData'
import { getPageAlternates } from '@/lib/page-metadata'
import { buildHomeJsonLd } from '@/lib/structured-data'

export const metadata: Metadata = {
  alternates: getPageAlternates('/'),
}

export default function HomePage() {
  return (
    <>
      <StructuredData data={buildHomeJsonLd()} />
      <Portfolio screen="home" />
    </>
  )
}
