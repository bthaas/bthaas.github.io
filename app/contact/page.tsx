import type { Metadata } from 'next'

import { PortfolioScreen } from '@/components/portfolio/PortfolioScreen'
import { sitePages } from '@/content/site-pages'
import { getPageAlternates } from '@/lib/page-metadata'

export const metadata: Metadata = {
  title: sitePages.contact.title,
  description: sitePages.contact.description,
  alternates: getPageAlternates(sitePages.contact.path),
}

export default function ContactPage() {
  return <PortfolioScreen screen="contact" />
}
