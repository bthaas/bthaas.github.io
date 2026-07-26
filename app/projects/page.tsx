import type { Metadata } from 'next'

import { PortfolioScreen } from '@/components/portfolio/PortfolioScreen'

export const metadata: Metadata = {
  title: 'Projects | Brett Haas',
  description: 'Computer vision, collaborative systems, and language-model research projects.',
}

export default function ProjectsPage() {
  return <PortfolioScreen screen="projects" />
}
