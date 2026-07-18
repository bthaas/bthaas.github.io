import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SplashCursor from './SplashCursor'

describe('Atlas SplashCursor vendor', () => {
  it('owns a decorative pointer-transparent WebGL canvas', () => {
    const { container, unmount } = render(<SplashCursor className="atlas-ink" />)
    const root = container.querySelector('[data-fluid-cursor]')
    const canvas = container.querySelector('[data-fluid-cursor-canvas]')

    expect(root).toHaveClass('splash-cursor', 'atlas-ink')
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(canvas).toBeInstanceOf(HTMLCanvasElement)

    expect(() => unmount()).not.toThrow()
  })

  it('accepts the software-renderer tier without changing its decorative contract', () => {
    const { container } = render(<SplashCursor constrained />)

    expect(container.querySelector('[data-fluid-cursor]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[data-fluid-cursor-canvas]')).toBeInTheDocument()
  })
})
