import type { Metadata } from 'next'

import { PortfolioScreen } from '@/components/portfolio/PortfolioScreen'
import { sitePages } from '@/content/site-pages'
import { getPageAlternates } from '@/lib/page-metadata'

export const metadata: Metadata = {
  title: sitePages.skills.title,
  description: sitePages.skills.description,
  alternates: getPageAlternates(sitePages.skills.path),
}

export default function SkillsPage() {
  return <PortfolioScreen screen="skills" />
}
