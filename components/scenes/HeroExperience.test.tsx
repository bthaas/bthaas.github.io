import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { detectWebGL, shouldRenderWebGL } from '@/lib/client-capabilities'

import { HeroExperience } from './HeroExperience'

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockHeroScene(props: { isMobile: boolean; showStats: boolean }) {
      return (
        <div
          data-mobile={String(props.isMobile)}
          data-stats={String(props.showStats)}
          data-testid="hero-scene"
        />
      )
    },
}))

vi.mock('@/lib/client-capabilities', () => ({
  detectWebGL: vi.fn(() => true),
  shouldRenderWebGL: vi.fn(
    ({ reducedMotion, webGLAvailable, width }) =>
      !reducedMotion && webGLAvailable && width >= 320,
  ),
}))

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

let observerCallback: ObserverCallback | undefined
const mediaListeners = new Set<() => void>()

function installMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: (_event: string, listener: () => void) => mediaListeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => mediaListeners.delete(listener),
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

class ControllableIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = '180px'
  readonly scrollMargin = '0px'
  readonly thresholds = [0]

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback as ObserverCallback
  }

  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = () => []
  unobserve = vi.fn()
}

describe('HeroExperience', () => {
  beforeEach(() => {
    observerCallback = undefined
    mediaListeners.clear()
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
    installMatchMedia(false)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200, writable: true })
    globalThis.IntersectionObserver = ControllableIntersectionObserver
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      writable: true,
      value: (callback: IdleRequestCallback) => {
        callback({ didTimeout: false, timeRemaining: () => 40 })
        return 11
      },
    })
    Object.defineProperty(window, 'cancelIdleCallback', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
  })

  it('keeps the static render when reduced motion disables WebGL', async () => {
    installMatchMedia(true)
    const fractureProgressRef = { current: 0 }

    const { container } = render(<HeroExperience fractureProgressRef={fractureProgressRef} />)

    await waitFor(() => expect(shouldRenderWebGL).toHaveBeenCalled())
    expect(container.querySelector('.hero-fallback')).toHaveAttribute(
      'src',
      '/assets/icarus-wings-fallback.webp',
    )
    expect(screen.queryByTestId('hero-scene')).not.toBeInTheDocument()
    expect(observerCallback).toBeUndefined()
  })

  it('lazy-mounts the mobile canvas and forwards the stats flag', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500, writable: true })
    window.history.replaceState({}, '', '/?stats=1')
    const fractureProgressRef = { current: 0.25 }

    const { container, unmount } = render(
      <HeroExperience fractureProgressRef={fractureProgressRef} />,
    )

    await waitFor(() => expect(observerCallback).toBeDefined())
    act(() => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    const scene = await screen.findByTestId('hero-scene')
    expect(scene).toHaveAttribute('data-mobile', 'true')
    expect(scene).toHaveAttribute('data-stats', 'true')
    expect(container.firstElementChild).toHaveClass('hero-visual-canvas')
    expect(detectWebGL).toHaveBeenCalled()

    act(() => {
      observerCallback?.([{ isIntersecting: false } as IntersectionObserverEntry])
    })
    expect(screen.queryByTestId('hero-scene')).not.toBeInTheDocument()
    expect(container.firstElementChild).not.toHaveClass('hero-visual-canvas')

    unmount()
    expect(window.cancelIdleCallback).toHaveBeenCalledWith(11)
  })

  it('re-evaluates capabilities after resize and media-query changes', async () => {
    const fractureProgressRef = { current: 0 }
    render(<HeroExperience fractureProgressRef={fractureProgressRef} />)

    await waitFor(() => expect(observerCallback).toBeDefined())
    act(() => {
      window.innerWidth = 280
      window.dispatchEvent(new Event('resize'))
      mediaListeners.forEach((listener) => listener())
    })

    await waitFor(() =>
      expect(shouldRenderWebGL).toHaveBeenLastCalledWith(
        expect.objectContaining({ width: 280 }),
      ),
    )
    expect(screen.queryByTestId('hero-scene')).not.toBeInTheDocument()
  })

  it('uses the timeout fallback when requestIdleCallback is unavailable', async () => {
    vi.useFakeTimers()
    Reflect.deleteProperty(window, 'requestIdleCallback')
    const fractureProgressRef = { current: 0 }

    render(<HeroExperience fractureProgressRef={fractureProgressRef} />)
    await act(async () => Promise.resolve())
    expect(observerCallback).toBeDefined()

    act(() => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry])
      vi.advanceTimersByTime(320)
    })
    expect(screen.getByTestId('hero-scene')).toHaveAttribute('data-mobile', 'false')
    vi.useRealTimers()
  })
})
