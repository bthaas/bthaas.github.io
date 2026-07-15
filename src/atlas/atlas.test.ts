import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { countUp } from './count-up'
import { setupReveals } from './reveal'
import { initializeAtlas } from './runtime'
import { createScrollBus, type ScrollSnapshot } from './scroll-bus'
import { splitText } from './split-text'

describe('atlas DOM capabilities', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('splits text visually while preserving one accessible label', () => {
    const heading = document.createElement('h1')
    heading.textContent = 'Brett Haas'

    splitText(heading, 'character')

    expect(heading.getAttribute('aria-label')).toBe('Brett Haas')
    expect(heading.textContent).toBe('Brett Haas')
    expect(heading.querySelectorAll('[aria-hidden="true"]')).toHaveLength(9)
  })

  it('renders a complete metric synchronously when duration is zero', () => {
    const metric = document.createElement('strong')
    metric.textContent = '616K+'

    countUp(metric, '616K+', { durationMs: 0 })

    expect(metric.textContent).toBe('616K+')
  })

  it('animates and cancels a count-up through requestAnimationFrame', () => {
    const callbacks: FrameRequestCallback[] = []
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const cancelFrame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)
    const metric = document.createElement('strong')

    const cancel = countUp(metric, '55%', { durationMs: 100, steps: 10 })
    callbacks[0](0)
    callbacks[1](50)
    callbacks[2](100)
    cancel()

    expect(metric.textContent).toBe('55%')
    expect(requestFrame).toHaveBeenCalledTimes(3)
    expect(cancelFrame).toHaveBeenCalledWith(3)
  })

  it('does no enhancement work when reduced motion is requested', () => {
    const createBus = vi.fn()
    const prepareReveals = vi.fn()
    const matchMedia = vi.fn(() => ({ matches: true }))

    initializeAtlas({ createBus, document, matchMedia, prepareReveals, window })

    expect(document.documentElement).not.toHaveClass('atlas-js')
    expect(document.documentElement).not.toHaveAttribute('data-atlas')
    expect(createBus).not.toHaveBeenCalled()
    expect(prepareReveals).not.toHaveBeenCalled()
  })

  it('marks, publishes, and cleans up the enhanced runtime', () => {
    let subscriber: ((snapshot: ScrollSnapshot) => void) | undefined
    const unsubscribe = vi.fn()
    const destroyBus = vi.fn()
    const cleanupReveals = vi.fn()
    const createBus = vi.fn(() => ({
      destroy: destroyBus,
      subscribe: (next: (snapshot: ScrollSnapshot) => void) => {
        subscriber = next
        return unsubscribe
      },
    }))
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent')

    const destroy = initializeAtlas({
      createBus,
      document,
      matchMedia: () => ({ matches: false }),
      prepareReveals: () => cleanupReveals,
      window,
    })
    subscriber?.({ documentProgress: 0.5, scrollY: 500 })
    destroy()
    destroy()

    expect(document.documentElement).toHaveClass('atlas-js')
    expect(document.documentElement).toHaveAttribute('data-atlas', 'ready')
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'atlas:scroll' }))
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(cleanupReveals).toHaveBeenCalledOnce()
    expect(destroyBus).toHaveBeenCalledOnce()
  })

  it('reveals direct and staggered targets through one observer', () => {
    const direct = document.createElement('div')
    direct.dataset.reveal = ''
    const group = document.createElement('div')
    group.dataset.revealStagger = ''
    group.append(document.createElement('p'), document.createElement('p'))
    document.body.append(direct, group)

    const observed: Element[] = []
    const unobserve = vi.fn()
    class ObserverStub {
      constructor(private readonly callback: IntersectionObserverCallback) {}

      observe(target: Element) {
        observed.push(target)
      }

      disconnect() {}

      unobserve = unobserve

      revealAll() {
        this.callback(
          observed.map((target) => ({ isIntersecting: true, target }) as IntersectionObserverEntry),
          this as unknown as IntersectionObserver,
        )
      }
    }

    let observer: ObserverStub | undefined
    const cleanup = setupReveals(document, (callback) => {
      observer = new ObserverStub(callback)
      return observer as unknown as IntersectionObserver
    })
    observer?.revealAll()

    expect(observed).toHaveLength(3)
    expect(observed.every((target) => target.classList.contains('is-revealed'))).toBe(true)
    expect(group.children[1]).toHaveStyle({ '--atlas-reveal-delay': '80ms' })
    expect(document.documentElement).toHaveClass('atlas-reveal-ready')
    expect(unobserve).toHaveBeenCalledTimes(3)
    cleanup()
  })

  it('leaves the document static when IntersectionObserver is unavailable', () => {
    const cleanup = setupReveals(document, undefined)

    expect(document.documentElement).not.toHaveClass('atlas-reveal-ready')
    expect(cleanup()).toBeUndefined()
  })

  it('publishes one bounded snapshot per queued scroll frame', () => {
    Object.defineProperties(document.documentElement, {
      scrollHeight: { configurable: true, value: 3000 },
    })
    Object.defineProperties(window, {
      innerHeight: { configurable: true, value: 1000 },
      scrollY: { configurable: true, value: 1000 },
    })
    const callbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callbacks.push(callback)
      return callbacks.length
    }))
    const cancelFrame = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)
    const listenerSpy = vi.spyOn(window, 'addEventListener')
    const subscriber = vi.fn()

    const bus = createScrollBus()
    const unsubscribe = bus.subscribe(subscriber)
    window.dispatchEvent(new Event('scroll'))
    expect(callbacks).toHaveLength(1)
    callbacks[0](0)
    window.dispatchEvent(new Event('scroll'))
    callbacks[1](16)
    unsubscribe()
    bus.destroy()

    expect(listenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    expect(subscriber).toHaveBeenLastCalledWith({ documentProgress: 0.5, scrollY: 1000 })
    expect(cancelFrame).toHaveBeenCalledWith(2)
  })

  it('does not split the same element twice', () => {
    const heading = document.createElement('h2')
    heading.textContent = 'Keep building.'

    splitText(heading, 'word')
    splitText(heading, 'character')

    expect(heading.dataset.atlasSplit).toBe('word')
    expect(heading.querySelectorAll('.atlas-split-mask')).toHaveLength(2)
  })
})
