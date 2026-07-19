import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroMasthead } from './HeroMasthead'
import { SunBadge } from './SunBadge'

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

describe('React-owned hero overdrive', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.documentElement.className = ''
    setReducedMotion(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('splits an entered masthead for reversible scroll scatter and cleans it up', () => {
    sessionStorage.setItem('atlas-preloader-entered', '1')
    sessionStorage.setItem('atlas-entered', '1')
    const { container, unmount } = render(
      <section id="hero"><HeroMasthead name="Brett Haas" /></section>,
    )

    expect(container.querySelector('#hero-name')).toHaveAttribute('aria-label', 'Brett Haas')
    expect(container.querySelectorAll('.hero-masthead__line > div')).toHaveLength(9)
    expect(container.querySelector('.hero-masthead__line-mask')).toHaveStyle({ overflow: 'visible' })
    expect(() => unmount()).not.toThrow()
  })

  it('owns the first-session entrance and waits for the preloader handshake', () => {
    const { container } = render(
      <>
        <nav className="site-nav" />
        <div className="hero-meta" />
        <section id="hero"><HeroMasthead name="Brett Haas" /></section>
      </>,
    )

    expect(container.querySelectorAll('.hero-masthead__line > div')).toHaveLength(0)
    act(() => window.dispatchEvent(new CustomEvent('atlas:preloader-complete')))
    expect(container.querySelectorAll('.hero-masthead__line > div')).toHaveLength(9)
    expect(sessionStorage.getItem('atlas-entered')).toBe('1')
    expect(document.documentElement).toHaveClass('atlas-entering')
  })

  it('keeps the static heading intact when reduced motion is requested', () => {
    setReducedMotion(true)
    const { container } = render(<HeroMasthead name="Brett Haas" />)

    expect(container.querySelector('#hero-name')).toHaveTextContent('Brett Haas')
    expect(container.querySelector('.hero-masthead__line')).not.toBeInTheDocument()
    expect(document.documentElement).toHaveClass('atlas-entered')
  })

  it('animates and cleans the circular sun label', () => {
    const { container, unmount } = render(<SunBadge />)
    const circle = container.querySelector<HTMLElement>('.circular-text')!

    fireEvent.pointerEnter(circle)
    fireEvent.pointerLeave(circle)
    act(() => {
      window.dispatchEvent(new CustomEvent('atlas:sun-progress', {
        detail: { position: { x: 112, y: -14 } },
      }))
    })
    expect(container.querySelector('.sun-badge__orbit')).toHaveStyle({ left: '50%', top: '28.125%' })
    expect(container.querySelector('[data-atlas-sun-trigger]')).toHaveAccessibleName(
      'Release the sun spectacle',
    )
    expect(() => unmount()).not.toThrow()
  })

  it('dispatches one sun hit from mouse, Enter, or Space through the native button', () => {
    const hit = vi.fn()
    window.addEventListener('atlas:sun-hit', hit)
    render(<SunBadge />)

    fireEvent.click(document.querySelector('[data-atlas-sun-trigger]')!)

    expect(hit).toHaveBeenCalledTimes(1)
    window.removeEventListener('atlas:sun-hit', hit)
  })
})
