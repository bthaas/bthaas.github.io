import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { aboutDocument } from '@/content/editorial-documents'
import { siteContent } from '@/content/site-content'

import AboutPage, { metadata } from './page'

describe('about page', () => {
  it('renders the About document in the atlas editorial layout', () => {
    const { container } = render(<AboutPage />)
    const main = screen.getByRole('main')

    expect(screen.getByRole('heading', { level: 1, name: 'About Brett Haas' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent))
      .toEqual(aboutDocument.sections.map(({ heading }) => heading))
    expect(main.textContent?.length).toBeGreaterThan(1500)
    expect(container.querySelector('.site-header')).toHaveAttribute('data-current', 'document')
    expect(within(main).getByRole('link', { name: siteContent.projects[0].name }))
      .toHaveAttribute('href', `/projects/${siteContent.projects[0].id}`)
    expect(within(main).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'target',
      '_blank',
    )
    expect(within(main).getByRole('link', { name: 'privacy policy' })).not.toHaveAttribute(
      'target',
    )
    expect(within(main).getByRole('navigation', { name: 'More from the atlas' })).toBeInTheDocument()
  })

  it('publishes ProfilePage JSON-LD and page metadata', () => {
    const { container } = render(<AboutPage />)
    const script = container.querySelector('script[type="application/ld+json"]')
    const data = JSON.parse(script?.textContent ?? '{}') as {
      '@graph': Array<{ '@type': string }>
    }

    expect(data['@graph'].map((node) => node['@type'])).toEqual(['ProfilePage', 'Person'])
    expect(metadata.title).toBe('About | Brett Haas')
    expect(metadata.openGraph).toMatchObject({
      siteName: 'Brett Haas',
      images: [{ url: '/icarus-atlas/hero-social-1600.webp' }],
    })
    expect(metadata.alternates).toEqual({
      canonical: '/about',
      types: { 'text/markdown': '/about.md' },
    })
  })
})
