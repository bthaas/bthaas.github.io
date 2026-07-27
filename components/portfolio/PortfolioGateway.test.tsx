import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { siteContent } from '@/content/site-content'
import { ATLAS_GATEWAY_SELECTION_EVENT } from '@/lib/atlas-events'

import { PortfolioGateway } from './PortfolioGateway'

const gatewayEntrance = vi.hoisted(() => ({
  state: 'settled' as 'entering' | 'pending' | 'settled',
}))

vi.mock('./useGatewayEntrance', () => ({
  useGatewayEntrance: () => gatewayEntrance.state,
}))

const renderGateway = () => render(<PortfolioGateway identity={siteContent.identity} />)

describe('PortfolioGateway', () => {
  beforeEach(() => {
    gatewayEntrance.state = 'settled'
    sessionStorage.clear()
    sessionStorage.setItem('atlas-gateway-entered', '1')
  })

  it('starts on Experience with side arrows and no bottom control strip', () => {
    const { container } = renderGateway()

    expect(screen.getByRole('heading', { name: 'Explore the portfolio' })).toBeInTheDocument()
    expect(container.querySelector('.portfolio-gateway__word')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('.portfolio-gateway__word')).toHaveTextContent('BRETT HAAS')
    expect(screen.getByText('Engineer · Researcher · Builder')).toBeInTheDocument()
    const introduction = screen.getByRole('group', { name: 'Portfolio introduction' })
    expect(within(introduction).getByText('Portfolio / 2026')).toBeInTheDocument()
    expect(within(introduction).getByText('Software Engineer')).toBeInTheDocument()
    expect(within(introduction).getByText('Bellevue, Washington')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Experience screen' })).toHaveAttribute(
      'href',
      '/experience',
    )
    expect(screen.queryByRole('link', { name: 'Open Experience' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous category' })).toHaveClass(
      'portfolio-gateway__side-arrow',
      'portfolio-gateway__side-arrow--previous',
    )
    expect(screen.getByRole('button', { name: 'Next category' })).toHaveClass(
      'portfolio-gateway__side-arrow',
      'portfolio-gateway__side-arrow--next',
    )
    expect(container.querySelector('.portfolio-gateway__controls')).toBeNull()
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
    expect(screen.getByTestId('portfolio-gateway-portal-source')).toBeInTheDocument()
    const surfaceLink = screen.getByRole('link', { name: 'Open Experience screen' })
    expect(surfaceLink).toHaveClass('portfolio-gateway__surface-link')
    expect(surfaceLink).toHaveAttribute('data-transition-kind', 'portal')
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

    const { container } = renderGateway()
    const gateway = container.querySelector('#portfolio-gateway')
    const carousel = screen.getByRole('region', { name: 'Portfolio category carousel' })

    expect(gateway).toHaveAttribute('data-gateway-entrance', 'pending')
    expect(carousel).toHaveAttribute('aria-disabled', 'true')
    expect(carousel).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('button', { name: 'Previous category' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next category' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Open Experience screen' }))
      .toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('link', { name: 'Open Experience screen' }))
      .toHaveAttribute('tabindex', '-1')
    expect(
      fireEvent.click(screen.getByRole('link', { name: 'Open Experience screen' })),
    ).toBe(false)

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
    const { container } = renderGateway()

    expect(container.querySelector('#portfolio-gateway')).toHaveAttribute(
      'data-gateway-entrance',
      'settled',
    )
    expect(screen.getByRole('region', { name: 'Portfolio category carousel' }))
      .not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('button', { name: 'Next category' })).toBeEnabled()
  })

  it('cycles categories with side buttons and arrow keys while wrapping', () => {
    renderGateway()
    const carousel = screen.getByRole('region', { name: 'Portfolio category carousel' })
    const previous = screen.getByRole('button', { name: 'Previous category' })
    const next = screen.getByRole('button', { name: 'Next category' })

    fireEvent.pointerDown(previous, { button: 0, pointerId: 2 })
    fireEvent.pointerDown(next, { button: 0, pointerId: 3 })
    expect(carousel).toHaveAttribute('data-dragging', 'false')

    fireEvent.click(next)
    expect(screen.getByRole('link', { name: 'Open Projects screen' })).toHaveAttribute(
      'href',
      '/projects',
    )
    expect(carousel).toHaveAttribute('data-active-index', '1')
    expect(screen.getByRole('status')).toHaveTextContent('Projects category selected')

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(screen.getByRole('link', { name: 'Open Skills screen' })).toHaveAttribute(
      'href',
      '/skills',
    )

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(screen.getByRole('link', { name: 'Open Contact screen' })).toHaveAttribute(
      'href',
      '/contact',
    )

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(screen.getByRole('link', { name: 'Open Experience screen' })).toHaveAttribute(
      'href',
      '/experience',
    )

    fireEvent.click(previous)
    expect(screen.getByRole('link', { name: 'Open Contact screen' })).toHaveAttribute(
      'href',
      '/contact',
    )
  })

  it('announces its selected destination to the Home route index', () => {
    const selections: string[] = []
    const handleSelection = (event: Event) => {
      selections.push((event as CustomEvent<{ route: string }>).detail.route)
    }
    window.addEventListener(ATLAS_GATEWAY_SELECTION_EVENT, handleSelection)

    const { unmount } = renderGateway()
    expect(selections).toEqual(['experience'])

    fireEvent.click(screen.getByRole('button', { name: 'Next category' }))
    expect(selections).toEqual(['experience', 'projects'])

    unmount()
    window.removeEventListener(ATLAS_GATEWAY_SELECTION_EVENT, handleSelection)
  })

  it('tracks a captured horizontal drag and snaps to the nearest category', () => {
    renderGateway()
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
    expect(screen.getByRole('link', { name: 'Open Projects screen' })).toHaveAttribute(
      'href',
      '/projects',
    )
    expect(release).toHaveBeenCalledWith(7)

    fireEvent.pointerDown(dragSurface, { button: 1, clientX: 600, pointerId: 8 })
    expect(carousel).toHaveAttribute('data-dragging', 'false')
  })

  it('cancels an active drag without changing the selected category', () => {
    renderGateway()
    const carousel = screen.getByRole('region', { name: 'Portfolio category carousel' })
    const dragSurface = screen.getByTestId('portfolio-gateway-drag-surface')
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
      setPointerCapture: { configurable: true, value: vi.fn() },
    })

    fireEvent.pointerDown(dragSurface, { button: 0, clientX: 600, pointerId: 13 })
    fireEvent.pointerMove(dragSurface, { clientX: 280, pointerId: 13 })
    fireEvent.pointerCancel(dragSurface, { pointerId: 13 })

    expect(carousel).toHaveAttribute('data-active-index', '0')
    expect(carousel).toHaveAttribute('data-dragging', 'false')
    expect(release).toHaveBeenCalledWith(13)
  })

  it('starts a drag over the invisible surface link without following it', () => {
    renderGateway()
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
