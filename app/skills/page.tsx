import type { Metadata } from 'next'

import { PortfolioScreen } from '@/components/portfolio/PortfolioScreen'

export const metadata: Metadata = {
  title: 'Skills | Brett Haas',
  description: 'The engineering, machine-learning, and product skills behind Brett Haas’s work.',
  alternates: { canonical: '/skills' },
}

export default function SkillsPage() {
  return <PortfolioScreen screen="skills" />
}
