import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PortfolioGateway } from './PortfolioGateway'

const gatewayEntrance = vi.hoisted(() => ({
  state: 'settled' as 'entering' | 'pending' | 'settled',
}))

vi.mock('./useGatewayEntrance', () => ({
  useGatewayEntrance: () => gatewayEntrance.state,
}))

describe('PortfolioGateway', () => {
  beforeEach(() => {
    gatewayEntrance.state = 'settled'
    sessionStorage.clear()
    sessionStorage.setItem('atlas-gateway-entered', '1')
  })

  it('starts on Experience with semantic carousel controls and destinations', () => {
    const { container } = render(<PortfolioGateway />)

    expect(screen.getByRole('heading', { name: 'Explore the portfolio' })).toBeInTheDocument()
    expect(container.querySelector('.portfolio-gateway__word')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('.portfolio-gateway__word')).toHaveTextContent('BRETT HAAS')
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
    expect(container.querySelector('#portfolio-gateway')).toHaveAttribute(
      'data-gateway-entrance',
      'settled',
    )
    expect(screen.getByRole('region', { name: 'Portfolio category carousel' }))
      .not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('region', { name: 'Portfolio category carousel' }))
      .toHaveAttribute('tabindex', '0')
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
    ).toHaveLength(0)
    expect(container.querySelector('.portfolio-gateway__fallback-reflection')).toBeNull()
    expect(container.querySelector('.portfolio-gateway__canvas')).toBeNull()
    expect(container.querySelectorAll('.portfolio-gateway__ground-shadow')).toHaveLength(1)
    expect(container.querySelectorAll('.portfolio-gateway__fallback-face')).toHaveLength(0)
    expect(
      container.querySelectorAll(
        '.portfolio-gateway__fallback-slice-body > .portfolio-gateway__surface-label',
      ),
    ).toHaveLength(48)
    expect(container.querySelector('.portfolio-gateway__face-label')).toBeNull()
    const surfaceLink = screen.getByRole('link', { name: 'Open Experience screen' })
    expect(surfaceLink).toHaveClass('portfolio-gateway__surface-link')
    expect(surfaceLink.querySelector('.portfolio-gateway__surface-link-text')).toHaveTextContent(
      'Experience',
    )
    expect(
      container.querySelectorAll('[data-gateway-category="experience"]'),
    ).toHaveLength(12)
    expect(
      container.querySelectorAll('[data-gateway-category="projects"]'),
    ).toHaveLength(12)
    expect(
      container.querySelectorAll('[data-gateway-category="skills"]'),
    ).toHaveLength(12)
    expect(
      container.querySelectorAll('[data-gateway-category="contact"]'),
    ).toHaveLength(12)
    for (const category of ['Experience', 'Projects', 'Skills', 'Contact']) {
      expect(
        Array.from(
          container.querySelectorAll(
            `[data-gateway-category="${category.toLowerCase()}"] .portfolio-gateway__surface-label`,
          ),
        ).map((label) => label.textContent),
      ).toEqual(Array(12).fill(category))
    }
  })

  it('locks every interaction while an unseen entrance waits for the viewport', () => {
    sessionStorage.clear()
    gatewayEntrance.state = 'pending'

    const { container } = render(<PortfolioGateway />)
    const gateway = container.querySelector('#portfolio-gateway')
    const carousel = screen.getByRole('region', { name: 'Portfolio category carousel' })

    expect(gateway).toHaveAttribute('data-gateway-entrance', 'pending')
    expect(carousel).toHaveAttribute('aria-disabled', 'true')
    expect(carousel).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('button', { name: 'Previous category' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next category' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Open Experience' }))
      .toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('link', { name: 'Open Experience' }))
      .toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    fireEvent.pointerDown(screen.getByTestId('portfolio-gateway-drag-surface'), {
      button: 0,
      clientX: 400,
      pointerId: 19,
    })
    expect(carousel).toHaveAttribute('data-active-index', '0')
    expect(carousel).toHaveAttribute('data-dragging', 'false')
  })

  it('keeps the reduced-motion settled result interactive', () => {
    sessionStorage.clear()
    const { container } = render(<PortfolioGateway />)

    expect(container.querySelector('#portfolio-gateway')).toHaveAttribute(
      'data-gateway-entrance',
      'settled',
    )
    expect(screen.getByRole('region', { name: 'Portfolio category carousel' }))
      .not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('button', { name: 'Next category' })).toBeEnabled()
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

  it('starts a drag over the invisible surface link without following it', () => {
    render(<PortfolioGateway />)
    const carousel = screen.getByRole('region', { name: 'Portfolio category carousel' })
    const dragSurface = screen.getByTestId('portfolio-gateway-drag-surface')
    const surfaceLink = screen.getByRole('link', { name: 'Open Experience screen' })
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

    fireEvent.pointerDown(surfaceLink, { button: 0, clientX: 600, pointerId: 11 })
    expect(carousel).toHaveAttribute('data-dragging', 'true')
    expect(capture).not.toHaveBeenCalled()

    fireEvent.pointerMove(dragSurface, { clientX: 280, pointerId: 11 })
    expect(capture).toHaveBeenCalledWith(11)
    fireEvent.pointerUp(dragSurface, { clientX: 280, pointerId: 11 })

    expect(carousel).toHaveAttribute('data-active-index', '1')
    expect(fireEvent.click(surfaceLink)).toBe(false)
    expect(release).toHaveBeenCalledWith(11)
  })
})
