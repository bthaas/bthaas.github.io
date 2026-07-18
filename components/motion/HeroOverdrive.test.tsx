import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScrollVelocity } from '@/components/bits/ScrollVelocity'

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

  it('animates and cleans the circular sun label and velocity band', () => {
    const { container, unmount } = render(
      <>
        <SunBadge />
        <ScrollVelocity direction={-1} text="FLIGHT LOG" />
      </>,
    )
    const circle = container.querySelector<HTMLElement>('.circular-text')!
    const track = container.querySelector<HTMLElement>('.scroll-velocity__track')!

    fireEvent.pointerEnter(circle)
    fireEvent.pointerLeave(circle)
    act(() => {
      window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { velocity: 120 } }))
      window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { velocity: -120 } }))
      window.dispatchEvent(new CustomEvent('atlas:sun-progress', {
        detail: { position: { x: 112, y: -14 } },
      }))
    })

    expect(track.style.transform).not.toBe('')
    expect(container.querySelector('.sun-badge__orbit')).toHaveStyle({ left: '50%', top: '28.125%' })
    expect(() => unmount()).not.toThrow()
  })
})
