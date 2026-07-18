import { act, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WebGLActivationGate } from './WebGLActivationGate'

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

describe('WebGLActivationGate', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-atlas-webgl-activated')
    setReducedMotion(false)
  })

  it('server-renders no markup', () => {
    expect(renderToString(<WebGLActivationGate />)).toBe('')
  })

  it('wakes deferred showpieces once on real pointer, scroll, touch, or keyboard intent', () => {
    const activated = vi.fn()
    window.addEventListener('atlas:activate-webgl', activated)
    render(<WebGLActivationGate />)

    act(() => window.dispatchEvent(new PointerEvent('pointermove')))
    act(() => window.dispatchEvent(new WheelEvent('wheel')))

    expect(document.documentElement).toHaveAttribute('data-atlas-webgl-activated', '')
    expect(activated).toHaveBeenCalledTimes(1)
    window.removeEventListener('atlas:activate-webgl', activated)
  })

  it('never arms WebGL under reduced motion', () => {
    setReducedMotion(true)
    const activated = vi.fn()
    window.addEventListener('atlas:activate-webgl', activated)
    render(<WebGLActivationGate />)

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' })))

    expect(document.documentElement).not.toHaveAttribute('data-atlas-webgl-activated')
    expect(activated).not.toHaveBeenCalled()
    window.removeEventListener('atlas:activate-webgl', activated)
  })
})
