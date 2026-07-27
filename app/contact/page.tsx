import type { Metadata } from 'next'

import { PortfolioScreen } from '@/components/portfolio/PortfolioScreen'

export const metadata: Metadata = {
  title: 'Contact | Brett Haas',
  description: 'Contact Brett Haas about software engineering, machine learning, and research.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return <PortfolioScreen screen="contact" />
}
