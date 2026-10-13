import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { siteOverview } from '@/content/site-overview'

import HomePage, { metadata } from './page'

describe('homepage', () => {
  it('contains only the full-screen rotating portfolio gateway', () => {
    const { container } = render(<HomePage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Brett Haas' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Portfolio category carousel' }),
    ).toBeInTheDocument()
    expect(container.querySelector('main')).toHaveAttribute('data-portfolio-screen', 'home')
    expect(
      Array.from(container.querySelectorAll('main > section')).map((section) => section.id),
    ).toEqual(['portfolio-gateway'])
    expect(container.querySelector('.hero-section')).not.toBeInTheDocument()
  })

  it('server-renders a meaningful text overview for readers without JavaScript', () => {
    const { container } = render(<HomePage />)
    const main = container.querySelector('main') as HTMLElement

    expect(main).toHaveTextContent(siteOverview.summary)
    for (const { description } of siteOverview.sections) {
      expect(main).toHaveTextContent(description)
    }
    expect(main.textContent?.length).toBeGreaterThan(1500)
  })

  it('publishes Person and WebSite JSON-LD', () => {
    const { container } = render(<HomePage />)
    const scripts = container.querySelectorAll('script[type="application/ld+json"]')
    const data = JSON.parse(scripts[0]?.textContent ?? '{}') as {
      '@graph': Array<{ '@type': string }>
    }

    expect(scripts).toHaveLength(1)
    expect(data['@graph'].map((node) => node['@type'])).toEqual(['WebSite', 'Person'])
  })

  it('advertises the Markdown twin alongside the canonical URL', () => {
    expect(metadata.alternates).toEqual({
      canonical: '/',
      types: { 'text/markdown': '/index.html.md' },
    })
  })
})
