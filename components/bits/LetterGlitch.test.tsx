import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LetterGlitch from './LetterGlitch'

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

describe('Atlas LetterGlitch vendor', () => {
  beforeEach(() => setReducedMotion(true))

  it('keeps only a static decorative shell under reduced motion', () => {
    const { container } = render(
      <LetterGlitch message="This plate is missing from the atlas" />,
    )

    expect(container.querySelector('[data-letter-glitch]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
  })

  it('lazily mounts the ink-on-cream canvas when motion is allowed', () => {
    setReducedMotion(false)
    const context = {
      clearRect: vi.fn(),
      fillText: vi.fn(),
      setTransform: vi.fn(),
      fillStyle: '',
      font: '',
      globalAlpha: 1,
      textBaseline: '',
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    )

    const { container } = render(
      <LetterGlitch message="This plate is missing from the atlas" />,
    )

    act(() => undefined)
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[data-letter-glitch]')).toHaveClass('letter-glitch')
  })
})
