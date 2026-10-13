import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { privacyDocument } from '@/content/editorial-documents'

import PrivacyPage, { metadata } from './page'

describe('privacy page', () => {
  it('renders the policy with its effective date and every section', () => {
    render(<PrivacyPage />)
    const main = screen.getByRole('main')

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument()
    expect(screen.getByText('Effective October 12, 2026')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent))
      .toEqual(privacyDocument.sections.map(({ heading }) => heading))
    expect(main.textContent?.length).toBeGreaterThan(1500)
    expect(screen.getByRole('link', { name: 'PouchLess privacy policy' }))
      .toHaveAttribute('href', '/nicotine/privacy/')
  })

  it('publishes canonical and Markdown alternates', () => {
    expect(metadata.title).toBe('Privacy | Brett Haas')
    expect(metadata.alternates).toEqual({
      canonical: '/privacy',
      types: { 'text/markdown': '/privacy.md' },
    })
  })
})
