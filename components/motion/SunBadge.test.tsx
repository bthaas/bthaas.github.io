import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('SunBadge', () => {
  beforeEach(() => {
    setReducedMotion(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('moves the sun trigger without rendering a circular location label', () => {
    const { container, unmount } = render(<SunBadge />)

    act(() => {
      window.dispatchEvent(new CustomEvent('atlas:sun-progress'))
      window.dispatchEvent(new CustomEvent('atlas:sun-progress', {
        detail: { position: { x: 'invalid', y: 0 } },
      }))
      window.dispatchEvent(new CustomEvent('atlas:sun-progress', {
        detail: { position: { x: 0, y: 'invalid' } },
      }))
    })
    expect(container.querySelector('.sun-badge__orbit')).not.toHaveAttribute('style')

    act(() => {
      window.dispatchEvent(new CustomEvent('atlas:sun-progress', {
        detail: { position: { x: 112, y: -14 } },
      }))
    })
    expect(container.querySelector('.sun-badge__orbit')).toHaveStyle({ left: '50%', top: '28.125%' })
    expect(container.querySelector('.circular-text')).not.toBeInTheDocument()
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

  it('keeps the sun trigger static when reduced motion is requested', () => {
    setReducedMotion(true)
    const { container } = render(<SunBadge />)

    act(() => {
      window.dispatchEvent(new CustomEvent('atlas:sun-progress', {
        detail: { position: { x: 112, y: -14 } },
      }))
    })

    expect(container.querySelector('.sun-badge__orbit')).not.toHaveAttribute('style')
  })
})
