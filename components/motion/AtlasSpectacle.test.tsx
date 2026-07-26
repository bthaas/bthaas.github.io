import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AtlasSpectacle } from './AtlasSpectacle'

const konamiKeys = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const

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

describe('AtlasSpectacle', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.documentElement.removeAttribute('data-atlas-spectacle-start')
    setReducedMotion(false)
  })

  it('triggers once from the Konami code and gates the session', () => {
    const spectacle = vi.fn()
    window.addEventListener('atlas:sun-spectacle', spectacle)
    render(<AtlasSpectacle />)

    for (const key of konamiKeys) {
      fireEvent.keyDown(window, { key })
    }

    expect(spectacle).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('atlas-sun-spectacle')).toBe('1')
    expect(document.documentElement).toHaveAttribute('data-atlas-spectacle-start')

    for (const key of konamiKeys) {
      fireEvent.keyDown(window, { key })
    }
    expect(spectacle).toHaveBeenCalledTimes(1)
    window.removeEventListener('atlas:sun-spectacle', spectacle)
  })

  it('does not arm any spectacle input under reduced motion', () => {
    setReducedMotion(true)
    const spectacle = vi.fn()
    window.addEventListener('atlas:sun-spectacle', spectacle)
    render(<AtlasSpectacle />)

    for (const key of konamiKeys) {
      fireEvent.keyDown(window, { key })
    }

    expect(spectacle).not.toHaveBeenCalled()
    expect(screen.getByTestId('atlas-spectacle')).toHaveAttribute('aria-hidden', 'true')
    window.removeEventListener('atlas:sun-spectacle', spectacle)
  })
})
