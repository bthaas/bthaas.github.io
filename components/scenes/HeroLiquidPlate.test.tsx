import { act, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'

import { HeroLiquidPlate } from './HeroLiquidPlate'

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockHeroLiquidScene(props: { active: boolean; isConstrained: boolean }) {
      return (
        <div
          data-active={String(props.active)}
          data-constrained={String(props.isConstrained)}
          data-testid="hero-liquid-scene"
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

describe('HeroLiquidPlate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listeners.clear()
    reducedMotion = false
    installMatchMedia()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280, writable: true })
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      globalThis.setTimeout(() => callback(16), 0)
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

  it('server-renders the preloaded LCP picture without a canvas dependency', () => {
    const markup = renderToString(<HeroLiquidPlate />)

    expect(markup).toContain('atlas-picture--hero')
    expect(markup).toContain('fetchPriority="high"')
    expect(markup).not.toContain('hero-liquid-scene')
  })

  it('never mounts WebGL when the global reduced-motion kill switch is active', async () => {
    reducedMotion = true
    render(<HeroLiquidPlate />)

    await waitFor(() => expect(shouldRenderWebGL).toHaveBeenCalled())
    expect(screen.queryByTestId('hero-liquid-scene')).not.toBeInTheDocument()
    expect(screen.getByAltText('A geometric Aegean city aligned with a rising sun')).toBeVisible()
  })

  it('fails closed without WebGL and lazy-mounts a constrained mobile plane when eligible', async () => {
    vi.mocked(detectWebGLProfile).mockReturnValueOnce({ available: false, constrained: false })
    const first = render(<HeroLiquidPlate />)
    await waitFor(() => expect(shouldRenderWebGL).toHaveBeenCalled())
    expect(screen.queryByTestId('hero-liquid-scene')).not.toBeInTheDocument()
    first.unmount()

    vi.clearAllMocks()
    window.innerWidth = 500
    render(<HeroLiquidPlate />)
    const scene = await screen.findByTestId('hero-liquid-scene')
    expect(scene).toHaveAttribute('data-constrained', 'true')

    act(() => {
      reducedMotion = true
      listeners.forEach((listener) => listener())
    })
    expect(screen.queryByTestId('hero-liquid-scene')).not.toBeInTheDocument()
  })
})
