import type { Metadata } from 'next'

import { PortfolioScreen } from '@/components/portfolio/PortfolioScreen'
import { sitePages } from '@/content/site-pages'
import { getPageAlternates } from '@/lib/page-metadata'

export const metadata: Metadata = {
  title: sitePages.experience.title,
  description: sitePages.experience.description,
  alternates: getPageAlternates(sitePages.experience.path),
}

export default function ExperiencePage() {
  return <PortfolioScreen screen="experience" />
}
