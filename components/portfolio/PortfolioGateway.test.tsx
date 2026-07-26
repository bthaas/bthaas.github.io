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
    const { container } = render(<PortfolioGateway />)

    expect(screen.getByRole('heading', { name: 'Explore the portfolio' })).toBeInTheDocument()
    expect(screen.getByText('BRETT HAAS')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Engineer · Researcher · Builder')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Experience' })).toHaveAttribute(
      'href',
      '/experience',
    )
    expect(screen.getByRole('link', { name: 'Open Experience screen' })).toHaveAttribute(
      'href',
      '/experience',
    )
    expect(screen.getByRole('button', { name: 'Previous category' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next category' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Portfolio category carousel' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Experience category selected')
    expect(
      container.querySelectorAll(
        '.portfolio-gateway__fallback-ring > .portfolio-gateway__fallback-slice',
      ),
    ).toHaveLength(48)
    expect(
      container.querySelectorAll(
        '.portfolio-gateway__fallback-reflection-ring > .portfolio-gateway__fallback-slice',
      ),
    ).toHaveLength(48)
    expect(container.querySelectorAll('.portfolio-gateway__fallback-face')).toHaveLength(0)
    expect(
      container.querySelectorAll('[data-gateway-category="experience"]'),
    ).toHaveLength(24)
    expect(
      container.querySelectorAll('[data-gateway-category="projects"]'),
    ).toHaveLength(24)
    expect(
      container.querySelectorAll('[data-gateway-category="skills"]'),
    ).toHaveLength(24)
    expect(
      container.querySelectorAll('[data-gateway-category="contact"]'),
    ).toHaveLength(24)
  })

  it('cycles categories with buttons and arrow keys while wrapping', () => {
    render(<PortfolioGateway />)
    const carousel = screen.getByRole('region', { name: 'Portfolio category carousel' })
    const next = screen.getByRole('button', { name: 'Next category' })

    fireEvent.click(next)
    expect(screen.getByRole('link', { name: 'Open Projects' })).toHaveAttribute('href', '/projects')
    expect(carousel).toHaveAttribute('data-active-index', '1')
    expect(screen.getByRole('status')).toHaveTextContent('Projects category selected')

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(screen.getByRole('link', { name: 'Open Skills' })).toHaveAttribute('href', '/skills')

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(screen.getByRole('link', { name: 'Open Contact' })).toHaveAttribute('href', '/contact')

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(screen.getByRole('link', { name: 'Open Experience' })).toHaveAttribute(
      'href',
      '/experience',
    )

    fireEvent.keyDown(carousel, { key: 'ArrowLeft' })
    expect(screen.getByRole('link', { name: 'Open Contact' })).toHaveAttribute('href', '/contact')
  })

  it('tracks a captured horizontal drag and snaps to the nearest category', () => {
    render(<PortfolioGateway />)
    const carousel = screen.getByRole('region', { name: 'Portfolio category carousel' })
    const dragSurface = screen.getByTestId('portfolio-gateway-drag-surface')
    const ring = dragSurface.querySelector('.portfolio-gateway__fallback-ring')
    const capture = vi.fn()
    const release = vi.fn()
    Object.defineProperties(dragSurface, {
      getBoundingClientRect: {
        configurable: true,
        value: () => ({
          bottom: 500,
          height: 400,
          left: 0,
          right: 800,
          top: 100,
          width: 800,
          x: 0,
          y: 100,
          toJSON: () => ({}),
        }),
      },
      releasePointerCapture: { configurable: true, value: release },
      setPointerCapture: { configurable: true, value: capture },
    })

    fireEvent.pointerDown(dragSurface, { button: 0, clientX: 600, pointerId: 7 })
    expect(carousel).toHaveAttribute('data-dragging', 'true')
    expect(capture).toHaveBeenCalledWith(7)

    fireEvent.pointerMove(dragSurface, { clientX: 280, clientY: 300, pointerId: 7 })
    expect(ring).toHaveStyle({
      transform: 'translateZ(calc(-1 * var(--gateway-cylinder-radius))) rotateY(-72deg)',
    })

    fireEvent.pointerUp(dragSurface, { clientX: 280, pointerId: 7 })
    expect(carousel).toHaveAttribute('data-dragging', 'false')
    expect(carousel).toHaveAttribute('data-active-index', '1')
    expect(screen.getByRole('link', { name: 'Open Projects' })).toHaveAttribute(
      'href',
      '/projects',
    )
    expect(release).toHaveBeenCalledWith(7)
  })
})
