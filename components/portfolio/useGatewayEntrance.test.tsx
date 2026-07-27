import { act, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useGatewayEntrance } from './useGatewayEntrance'

const gsapMock = vi.hoisted(() => {
  const timeline = {
    call: vi.fn(),
    kill: vi.fn(),
    to: vi.fn(),
  }
  timeline.call.mockReturnValue(timeline)
  timeline.to.mockReturnValue(timeline)

  return {
    createTimeline: vi.fn(),
    options: undefined as { onComplete?: () => void } | undefined,
    registerPlugin: vi.fn(),
    set: vi.fn(),
    timeline,
  }
})

vi.mock('@gsap/react', async () => {
  const React = await import('react')
  return {
    useGSAP: (callback: () => void | (() => void)) => {
      React.useLayoutEffect(callback, [])
    },
  }
})

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: gsapMock.registerPlugin,
    set: gsapMock.set,
    timeline: gsapMock.createTimeline,
  },
}))

function HookHarness({
  complete = true,
  sideControls = false,
}: {
  readonly complete?: boolean
  readonly sideControls?: boolean
}) {
  const rootRef = useRef<HTMLElement>(null)
  const state = useGatewayEntrance(rootRef)

  return (
    <section ref={rootRef}>
      <p className="portfolio-gateway__word">
        <span data-gateway-word-character>B</span>
      </p>
      <p className="portfolio-gateway__introduction">Introduction</p>
      {complete && sideControls ? (
        <>
          <button className="portfolio-gateway__side-arrow" type="button">Previous</button>
          <button className="portfolio-gateway__side-arrow" type="button">Next</button>
        </>
      ) : null}
      {complete && !sideControls ? <div className="portfolio-gateway__controls" /> : null}
      <div className="portfolio-gateway__ground-shadow" />
      {Array.from({ length: 48 }, (_, index) => (
        <span data-gateway-entrance-slice key={index} />
      ))}
      <output data-testid="entrance-state">{state}</output>
    </section>
  )
}

const originalIntersectionObserver = globalThis.IntersectionObserver
const originalMatchMedia = window.matchMedia

describe('useGatewayEntrance', () => {
  let mediaMatches = false
  let motionChange: (() => void) | undefined

  beforeEach(() => {
    sessionStorage.clear()
    mediaMatches = false
    motionChange = undefined
    gsapMock.options = undefined
    gsapMock.createTimeline.mockReset()
    gsapMock.registerPlugin.mockClear()
    gsapMock.set.mockClear()
    gsapMock.timeline.call.mockClear().mockReturnValue(gsapMock.timeline)
    gsapMock.timeline.kill.mockClear()
    gsapMock.timeline.to.mockClear().mockReturnValue(gsapMock.timeline)
    gsapMock.createTimeline.mockImplementation((options) => {
      gsapMock.options = options
      return gsapMock.timeline
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        get matches() {
          return mediaMatches
        },
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: (_event: string, listener: () => void) => {
          motionChange = listener
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })
  })

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    })
    vi.restoreAllMocks()
  })

  it('prepares an unseen gateway, starts on intersection, and settles the timeline', () => {
    let observerCallback: IntersectionObserverCallback | undefined
    const observe = vi.fn()
    const disconnect = vi.fn()
    class GatewayObserver {
      readonly root = null
      readonly rootMargin = '0px'
      readonly scrollMargin = '0px'
      readonly thresholds = [0.2]
      disconnect = disconnect
      observe = observe
      takeRecords = vi.fn(() => [])
      unobserve = vi.fn()

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback
      }
    }
    globalThis.IntersectionObserver = GatewayObserver

    const { container } = render(<HookHarness />)
    expect(screen.getByTestId('entrance-state')).toHaveTextContent('pending')
    expect(observe).toHaveBeenCalledWith(container.querySelector('section'))
    expect(gsapMock.set).toHaveBeenCalled()

    act(() => {
      observerCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })
    expect(screen.getByTestId('entrance-state')).toHaveTextContent('pending')

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })
    expect(screen.getByTestId('entrance-state')).toHaveTextContent('entering')
    expect(gsapMock.createTimeline).toHaveBeenCalledOnce()
    expect(gsapMock.timeline.to).toHaveBeenCalled()

    act(() => gsapMock.options?.onComplete?.())
    expect(screen.getByTestId('entrance-state')).toHaveTextContent('settled')
    expect(sessionStorage.getItem('atlas-gateway-entered')).toBe('1')
    expect(disconnect).toHaveBeenCalled()
    expect(gsapMock.timeline.kill).toHaveBeenCalled()
  })

  it('skips preparation for reduced motion, prior visits, or incomplete markup', () => {
    mediaMatches = true
    const reduced = render(<HookHarness />)
    expect(screen.getByTestId('entrance-state')).toHaveTextContent('settled')
    expect(gsapMock.set).not.toHaveBeenCalled()
    reduced.unmount()

    mediaMatches = false
    sessionStorage.setItem('atlas-gateway-entered', '1')
    const seen = render(<HookHarness />)
    expect(screen.getByTestId('entrance-state')).toHaveTextContent('settled')
    expect(gsapMock.set).not.toHaveBeenCalled()
    seen.unmount()

    sessionStorage.clear()
    render(<HookHarness complete={false} />)
    expect(screen.getByTestId('entrance-state')).toHaveTextContent('settled')
    expect(gsapMock.set).not.toHaveBeenCalled()
  })

  it('starts without IntersectionObserver and snaps settled if motion is reduced mid-flight', () => {
    globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver
    render(<HookHarness />)

    expect(screen.getByTestId('entrance-state')).toHaveTextContent('entering')
    mediaMatches = true
    act(() => motionChange?.())

    expect(screen.getByTestId('entrance-state')).toHaveTextContent('settled')
    expect(sessionStorage.getItem('atlas-gateway-entered')).toBeNull()
    expect(gsapMock.timeline.kill).toHaveBeenCalled()
  })

  it('animates the side-arrow controls used by the current gateway', () => {
    globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver

    render(<HookHarness sideControls />)

    expect(screen.getByTestId('entrance-state')).toHaveTextContent('entering')
    expect(gsapMock.createTimeline).toHaveBeenCalledOnce()
  })
})
