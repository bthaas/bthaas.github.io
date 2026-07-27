import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setupContactFinale } from './contact'
import { setupCursor } from './cursor'
import type { AtlasEngine } from './engine'
import { setupLocalTime } from './local-time'
import { setupMagnetic } from './magnetic'
import { setupProjectPans } from './projects'
import { setupReveals } from './reveal'
import { initializeAtlas } from './runtime'
import { createScrollBus, type ScrollSnapshot } from './scroll-bus'
import { splitText } from './split-text'

function createPointerEngine() {
  const quickTargets: Array<{
    property: string
    setter: ReturnType<typeof vi.fn>
    target: unknown
  }> = []
  const quickTo = vi.fn((target: unknown, property: string) => {
    const setter = vi.fn() as ReturnType<typeof vi.fn> & { tween?: { kill: () => void } }
    setter.tween = { kill: vi.fn() }
    quickTargets.push({ property, setter, target })
    return setter
  })
  const engine = {
    gsap: {
      quickSetter: vi.fn(() => vi.fn()),
      quickTo,
      set: vi.fn(),
      to: vi.fn(() => ({ kill: vi.fn() })),
    },
  } as unknown as AtlasEngine

  return { engine, quickTargets }
}

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
    expect(heading.querySelectorAll('.atlas-split-word')).toHaveLength(2)
  })

  it('scrubs the complete contact finale from shared progress', () => {
    document.body.innerHTML = `
      <section id="contact" data-contact-finale>
        <span data-contact-sunrise></span>
        <p data-contact-detail>Next horizon</p>
        <h2 data-contact-title>Keep building.</h2>
        <p data-contact-detail>Start a conversation.</p>
        <a data-contact-detail href="mailto:test@example.com">Email</a>
        <a data-contact-detail href="https://github.com">GitHub</a>
        <a data-contact-detail href="https://linkedin.com">LinkedIn</a>
        <footer data-contact-detail>Footer</footer>
      </section>
    `
    const section = document.getElementById('contact')!
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({
      bottom: 3200,
      height: 1200,
      left: 0,
      right: 1200,
      top: 2000,
      width: 1200,
      x: 0,
      y: 2000,
      toJSON: () => undefined,
    })
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)

    const cleanup = setupContactFinale(document, window)
    const characters = Array.from(
      section.querySelectorAll<HTMLElement>('.atlas-split-mask--character > .atlas-split-token'),
    )
    const words = Array.from(
      section.querySelectorAll<HTMLElement>('[data-contact-word]'),
    )
    const details = Array.from(
      section.querySelectorAll<HTMLElement>('[data-contact-detail]'),
    )

    expect(characters).toHaveLength(13)
    expect(words).toHaveLength(2)
    expect(details).toHaveLength(6)
    expect(section).toHaveAttribute('data-contact-scroll-ready')
    expect(section.style.getPropertyValue('--atlas-contact-plate-reveal')).toBe('0')
    expect(section.style.getPropertyValue('--atlas-contact-image-y')).toBe('2.5%')
    expect(details.map((detail) => detail.style.getPropertyValue('--atlas-contact-detail-reveal')))
      .toEqual(['0', '0', '0', '0', '0', '0'])
    window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { scrollY: 2200 } }))

    expect(section.style.getPropertyValue('--atlas-contact-glow')).toBe('1')
    expect(section.style.getPropertyValue('--atlas-contact-plate-reveal')).toBe('1')
    expect(section.style.getPropertyValue('--atlas-contact-image-y')).toBe('-2.5%')
    expect(details.map((detail) => detail.style.getPropertyValue('--atlas-contact-detail-reveal')))
      .toEqual(['1', '1', '1', '1', '1', '1'])
    expect(words.map((word) => word.style.getPropertyValue('--atlas-contact-word-reveal'))).toEqual([
      '1',
      '1',
    ])
    expect(characters[0].style.getPropertyValue('--atlas-contact-character-x')).toBe('-0.12em')
    expect(characters[6].style.getPropertyValue('--atlas-contact-character-x')).toBe('0em')
    expect(characters[12].style.getPropertyValue('--atlas-contact-character-x')).toBe('0.12em')
    window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { scrollY: 2200 } }))
    expect(section.getBoundingClientRect).toHaveBeenCalledTimes(2)

    cleanup()
    expect(section).not.toHaveAttribute('data-contact-scroll-ready')
    expect(section.style.getPropertyValue('--atlas-contact-glow')).toBe('')
    expect(section.style.getPropertyValue('--atlas-contact-plate-reveal')).toBe('')
    expect(section.style.getPropertyValue('--atlas-contact-image-y')).toBe('')
    expect(details.map((detail) => detail.style.getPropertyValue('--atlas-contact-detail-reveal')))
      .toEqual(['', '', '', '', '', ''])
  })

  it('renders Bellevue time without depending on the viewer timezone', () => {
    document.body.innerHTML = '<p data-atlas-local-time>Bellevue, WA</p>'
    const schedule = vi.fn(() => 17)
    const clear = vi.fn()
    const cleanup = setupLocalTime(
      document,
      () => new Date('2026-07-15T12:34:00.000Z'),
      schedule,
      clear,
    )

    expect(document.querySelector('[data-atlas-local-time]')).toHaveTextContent(
      'Bellevue, WA — 05:34',
    )
    expect(schedule).toHaveBeenCalledWith(expect.any(Function), 60_000)
    cleanup()
    expect(clear).toHaveBeenCalledWith(17)
  })

  it('creates a fine-pointer cursor with external and dossier modes only', () => {
    document.body.innerHTML = `
      <a id="external" href="https://example.com" target="_blank">External</a>
      <button id="dossier" data-cursor="expand">Field notes</button>
      <picture id="plate"></picture>
    `
    const { engine } = createPointerEngine()
    const cleanup = setupCursor(document, () => true, engine)
    const cursor = document.querySelector<HTMLElement>('[data-atlas-cursor]')!

    document.getElementById('external')?.dispatchEvent(new MouseEvent('pointerover', {
      bubbles: true,
    }))
    expect(cursor).toHaveAttribute('data-cursor-mode', 'external')
    expect(cursor.querySelector('[data-atlas-cursor-label]')).toHaveTextContent('↗')

    document.getElementById('dossier')?.dispatchEvent(new MouseEvent('pointerover', {
      bubbles: true,
    }))
    expect(cursor).toHaveAttribute('data-cursor-mode', 'expand')
    expect(cursor.querySelector('[data-atlas-cursor-label]')).toHaveTextContent('+')

    document.getElementById('plate')?.dispatchEvent(new MouseEvent('pointerover', {
      bubbles: true,
    }))
    expect(cursor).toHaveAttribute('data-cursor-mode', 'default')
    expect(cursor.querySelector('[data-atlas-cursor-label]')).toHaveTextContent('')
    cleanup()
    expect(document.querySelector('[data-atlas-cursor]')).not.toBeInTheDocument()

    const touchCleanup = setupCursor(document, () => false, engine)
    expect(document.querySelector('[data-atlas-cursor]')).not.toBeInTheDocument()
    touchCleanup()
  })

  it('writes alternating project pan transforms from the shared scroll event', () => {
    document.body.innerHTML = `
      <picture class="project-art" data-project-pan><img /></picture>
      <picture class="project-art" data-project-pan><img /></picture>
      <picture class="project-art" data-project-pan><img /></picture>
    `
    const plates = Array.from(document.querySelectorAll<HTMLElement>('[data-project-pan]'))
    plates.forEach((plate) => {
      vi.spyOn(plate, 'getBoundingClientRect').mockReturnValue({
        bottom: 2600,
        height: 600,
        left: 0,
        right: 900,
        top: 2000,
        width: 900,
        x: 0,
        y: 2000,
        toJSON: () => undefined,
      })
    })
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    const cleanup = setupProjectPans(document, window, false)

    expect(document.documentElement).toHaveClass('atlas-project-fallback')
    window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { scrollY: 1000 } }))
    expect(plates.map((plate) => plate.style.getPropertyValue('--atlas-project-pan-x'))).toEqual([
      '-6.522%',
      '6.522%',
      '-6.522%',
    ])
    window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { scrollY: 1800 } }))
    expect(plates.map((plate) => plate.style.getPropertyValue('--atlas-project-pan-x'))).toEqual([
      '0%',
      '0%',
      '0%',
    ])
    cleanup()
    expect(document.documentElement).not.toHaveClass('atlas-project-fallback')
  })

  it('damps fine-pointer magnetic links without exceeding six pixels', () => {
    document.body.innerHTML = '<a data-magnetic href="#"><span>↗</span></a>'
    const link = document.querySelector<HTMLElement>('[data-magnetic]')!
    vi.spyOn(link, 'getBoundingClientRect').mockReturnValue({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    })
    const { engine, quickTargets } = createPointerEngine()
    const cleanup = setupMagnetic(document, () => true, engine)

    link.dispatchEvent(new MouseEvent('pointerenter', { clientX: 50, clientY: 50 }))
    link.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: -500 }))
    expect(quickTargets.find(({ property }) => property === 'x')?.setter).toHaveBeenCalledWith(6)
    expect(quickTargets.find(({ property }) => property === 'y')?.setter).toHaveBeenCalledWith(-6)
    expect(link).toHaveAttribute('data-magnetic-ready')
    cleanup()
    expect(link).not.toHaveAttribute('data-magnetic-ready')

    const touchCleanup = setupMagnetic(document, () => false, engine)
    expect(link).not.toHaveAttribute('data-magnetic-ready')
    touchCleanup()
  })

  it('does no enhancement work when reduced motion is requested', () => {
    const createBus = vi.fn()
    const createEngine = vi.fn()
    const prepareHorizon = vi.fn()
    const prepareContact = vi.fn()
    const prepareCursor = vi.fn()
    const prepareMagnetic = vi.fn()
    const prepareLocalTime = vi.fn()
    const prepareProjects = vi.fn()
    const prepareScramble = vi.fn()
    const prepareReveals = vi.fn()
    const matchMedia = vi.fn(() => ({ matches: true }))

    const cleanup = initializeAtlas({
      createBus,
      createEngine,
      document,
      matchMedia,
      prepareHorizon,
      prepareContact,
      prepareCursor,
      prepareMagnetic,
      prepareLocalTime,
      prepareProjects,
      prepareReveals,
      prepareScramble,
      window,
    })

    expect(document.documentElement).not.toHaveClass('atlas-js')
    expect(document.documentElement).not.toHaveAttribute('data-atlas')
    expect(createBus).not.toHaveBeenCalled()
    expect(createEngine).not.toHaveBeenCalled()
    expect(prepareHorizon).not.toHaveBeenCalled()
    expect(prepareContact).not.toHaveBeenCalled()
    expect(prepareCursor).not.toHaveBeenCalled()
    expect(prepareMagnetic).not.toHaveBeenCalled()
    expect(prepareLocalTime).not.toHaveBeenCalled()
    expect(prepareProjects).not.toHaveBeenCalled()
    expect(prepareScramble).not.toHaveBeenCalled()
    expect(prepareReveals).not.toHaveBeenCalled()
    cleanup()
  })

  it('marks, publishes, and cleans up the enhanced runtime', () => {
    let subscriber: ((snapshot: ScrollSnapshot) => void) | undefined
    const unsubscribe = vi.fn()
    const destroyBus = vi.fn()
    const destroyEngine = vi.fn()
    const refreshScrollTrigger = vi.fn()
    const disconnectLayoutObserver = vi.spyOn(ResizeObserver.prototype, 'disconnect')
    const observeLayout = vi.spyOn(ResizeObserver.prototype, 'observe')
    const engine = {
      ScrollTrigger: { refresh: refreshScrollTrigger },
      destroy: destroyEngine,
    } as unknown as AtlasEngine
    const createEngine = vi.fn(() => engine)
    const cleanupReveals = vi.fn()
    const cleanupHorizon = vi.fn()
    const cleanupContact = vi.fn()
    const cleanupCursor = vi.fn()
    const cleanupMagnetic = vi.fn()
    const cleanupLocalTime = vi.fn()
    const cleanupProjects = vi.fn()
    const cleanupScramble = vi.fn()
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
      createEngine,
      document,
      matchMedia: () => ({ matches: false }),
      prepareHorizon: () => cleanupHorizon,
      prepareContact: () => cleanupContact,
      prepareCursor: () => cleanupCursor,
      prepareMagnetic: () => cleanupMagnetic,
      prepareLocalTime: () => cleanupLocalTime,
      prepareProjects: () => cleanupProjects,
      prepareReveals: () => cleanupReveals,
      prepareScramble: () => cleanupScramble,
      window,
    })
    subscriber?.({ documentProgress: 0.5, scrollY: 500, velocity: 8 })
    destroy()
    destroy()

    expect(document.documentElement).toHaveClass('atlas-js')
    expect(document.documentElement).toHaveAttribute('data-atlas', 'ready')
    expect(createBus).toHaveBeenCalledWith(engine)
    expect(refreshScrollTrigger).toHaveBeenCalled()
    expect(observeLayout).toHaveBeenCalledWith(document.documentElement)
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'atlas:scroll' }))
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(cleanupHorizon).toHaveBeenCalledOnce()
    expect(cleanupContact).toHaveBeenCalledOnce()
    expect(cleanupCursor).toHaveBeenCalledOnce()
    expect(cleanupMagnetic).toHaveBeenCalledOnce()
    expect(cleanupLocalTime).toHaveBeenCalledOnce()
    expect(cleanupProjects).toHaveBeenCalledOnce()
    expect(cleanupScramble).toHaveBeenCalledOnce()
    expect(cleanupReveals).toHaveBeenCalledOnce()
    expect(destroyBus).toHaveBeenCalledOnce()
    expect(destroyEngine).toHaveBeenCalledOnce()
    expect(disconnectLayoutObserver).toHaveBeenCalledOnce()
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

  it('publishes bounded snapshots from the shared ScrollTrigger', () => {
    Object.defineProperties(document.documentElement, {
      scrollHeight: { configurable: true, value: 3000 },
    })
    Object.defineProperties(window, {
      innerHeight: { configurable: true, value: 1000 },
      scrollY: { configurable: true, value: 1000 },
    })
    let onUpdate: (() => void) | undefined
    const kill = vi.fn()
    const create = vi.fn((options: { onUpdate: () => void }) => {
      onUpdate = options.onUpdate
      return { kill }
    })
    const engine = {
      ScrollTrigger: { create },
      lenis: { scroll: 1000, velocity: 18 },
    }
    const subscriber = vi.fn()

    const bus = createScrollBus({
      document,
      engine: engine as never,
      window,
    })
    const unsubscribe = bus.subscribe(subscriber)
    subscriber.mockClear()
    engine.lenis.scroll = 1000
    window.dispatchEvent(new Event('scroll'))

    expect(subscriber).toHaveBeenLastCalledWith({
      documentProgress: 0.5,
      scrollY: 1000,
      velocity: 18,
    })

    subscriber.mockClear()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1500 })
    engine.lenis.scroll = 0
    engine.lenis.velocity = -12
    window.dispatchEvent(new Event('scroll'))
    expect(subscriber).toHaveBeenLastCalledWith({
      documentProgress: 0.75,
      scrollY: 1500,
      velocity: -12,
    })

    subscriber.mockClear()
    engine.lenis.scroll = 1000
    engine.lenis.velocity = 4
    onUpdate?.()
    expect(subscriber).toHaveBeenLastCalledWith({
      documentProgress: 0.5,
      scrollY: 1000,
      velocity: 4,
    })

    subscriber.mockClear()
    unsubscribe()
    bus.destroy()
    window.dispatchEvent(new Event('scroll'))

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      end: 'max',
      start: 0,
      trigger: document.documentElement,
    }))
    expect(subscriber).not.toHaveBeenCalled()
    expect(kill).toHaveBeenCalledOnce()
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
