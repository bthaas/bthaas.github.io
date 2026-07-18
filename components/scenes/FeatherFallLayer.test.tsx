import { act, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'

import { FeatherFallLayer } from './FeatherFallLayer'

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockFeatherFallScene(props: { isMobile: boolean; showStats: boolean }) {
      return (
        <div
          data-mobile={String(props.isMobile)}
          data-stats={String(props.showStats)}
          data-testid="feather-fall-scene"
        />
      )
    },
}))

vi.mock('@/lib/client-capabilities', () => ({
  detectWebGLProfile: vi.fn(() => ({ available: true, constrained: false })),
  shouldRenderWebGL: vi.fn(
    ({ reducedMotion, webGLAvailable, width }) =>
      !reducedMotion && webGLAvailable && width >= 320,
  ),
}))

const listeners = new Set<() => void>()
let reducedMotion = false

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      get matches() {
        return reducedMotion
      },
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

describe('FeatherFallLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listeners.clear()
    reducedMotion = false
    installMatchMedia()
    window.history.replaceState({}, '', '/')
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280, writable: true })
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(16)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: (callback: IdleRequestCallback) => {
        callback({ didTimeout: false, timeRemaining: () => 24 })
        return 2
      },
    })
    Object.defineProperty(window, 'cancelIdleCallback', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('server-renders nothing so no-JS and reduced-motion pages have no canvas shell', () => {
    expect(renderToString(<FeatherFallLayer />)).toBe('')
  })

  it('never mounts the scene when reduced motion is active', async () => {
    reducedMotion = true
    const { container } = render(<FeatherFallLayer />)

    await waitFor(() => expect(shouldRenderWebGL).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByTestId('feather-fall-scene')).not.toBeInTheDocument()
  })

  it('fails closed when the browser has no WebGL context', async () => {
    vi.mocked(detectWebGLProfile).mockReturnValueOnce({
      available: false,
      constrained: false,
    })
    const { container } = render(<FeatherFallLayer />)

    await waitFor(() => expect(shouldRenderWebGL).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByTestId('feather-fall-scene')).not.toBeInTheDocument()
  })

  it('lazy-mounts the tiered scene and removes it if eligibility changes', async () => {
    window.innerWidth = 500
    window.history.replaceState({}, '', '/?stats=1')
    render(<FeatherFallLayer />)

    const scene = await screen.findByTestId('feather-fall-scene')
    expect(scene).toHaveAttribute('data-mobile', 'true')
    expect(scene).toHaveAttribute('data-stats', 'true')
    expect(screen.getByTestId('feather-fall-layer')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('feather-fall-layer')).toHaveAttribute('data-feather-tier', 'mobile-40')
    expect(detectWebGLProfile).toHaveBeenCalled()

    act(() => {
      reducedMotion = true
      listeners.forEach((listener) => listener())
    })
    expect(screen.queryByTestId('feather-fall-scene')).not.toBeInTheDocument()
  })
})
