import type { Metadata } from 'next'

import { PortfolioScreen } from '@/components/portfolio/PortfolioScreen'
import { sitePages } from '@/content/site-pages'
import { getPageAlternates } from '@/lib/page-metadata'

export const metadata: Metadata = {
  title: sitePages.projects.title,
  description: sitePages.projects.description,
  alternates: getPageAlternates(sitePages.projects.path),
}

export default function ProjectsPage() {
  return <PortfolioScreen screen="projects" />
}
