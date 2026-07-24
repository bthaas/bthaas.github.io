import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PortfolioGateway } from './PortfolioGateway'

vi.mock('../scenes/AtlasWebGLScenes', () => ({
  PortfolioGatewayScene: ({ activeIndex }: { activeIndex: number }) => (
    <div data-testid="portfolio-gateway-scene" data-active-index={activeIndex} />
  ),
}))

describe('PortfolioGateway', () => {
  it('starts on Experience with semantic carousel controls and destinations', () => {
    render(<PortfolioGateway />)

    expect(screen.getByRole('heading', { name: 'Explore the portfolio' })).toBeInTheDocument()
    expect(screen.getByText('PORTFOLIO')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('link', { name: 'Open Experience' })).toHaveAttribute(
      'href',
      '#experience',
    )
    expect(screen.getByRole('button', { name: 'Previous category' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next category' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Portfolio category carousel' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Experience category selected')
  })

  it('cycles categories with buttons and arrow keys while wrapping', () => {
    render(<PortfolioGateway />)
    const carousel = screen.getByRole('region', { name: 'Portfolio category carousel' })
    const next = screen.getByRole('button', { name: 'Next category' })

    fireEvent.click(next)
    expect(screen.getByRole('link', { name: 'Open Projects' })).toHaveAttribute('href', '#projects')
    expect(carousel).toHaveAttribute('data-active-index', '1')
    expect(screen.getByRole('status')).toHaveTextContent('Projects category selected')

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(screen.getByRole('link', { name: 'Open Skills' })).toHaveAttribute('href', '#craft')

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(screen.getByRole('link', { name: 'Open Experience' })).toHaveAttribute(
      'href',
      '#experience',
    )

    fireEvent.keyDown(carousel, { key: 'ArrowLeft' })
    expect(screen.getByRole('link', { name: 'Open Skills' })).toHaveAttribute('href', '#craft')
  })
})
