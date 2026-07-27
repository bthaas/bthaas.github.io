import type { Metadata } from 'next'

import { PortfolioScreen } from '@/components/portfolio/PortfolioScreen'

export const metadata: Metadata = {
  title: 'Experience | Brett Haas',
  description: 'Brett Haas — research, model evaluation, and production software experience.',
  alternates: { canonical: '/experience' },
}

export default function ExperiencePage() {
  return <PortfolioScreen screen="experience" />
}
