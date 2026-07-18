import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setupContactFinale } from './contact'
import { setupCursor } from './cursor'
import type { AtlasEngine } from './engine'
import { setupExperienceChapter } from './experience'
import { setupLocalTime } from './local-time'
import { setupMagnetic } from './magnetic'
import { setupProjectPans } from './projects'
import { setupReveals } from './reveal'
import { initializeAtlas } from './runtime'
import { createScrollBus, type ScrollSnapshot } from './scroll-bus'
import { splitText } from './split-text'
import { setupSectionWayfinding, SUN_PROGRESS_EVENT } from './sun-arc'

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
    window.dispatchEvent(new CustomEvent(SUN_PROGRESS_EVENT, { detail: { progress: 0.98 } }))
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

  it('steps the Trajectory overlay lighting through three IO fallback depths', () => {
    document.body.innerHTML = `
      <section class="experience-section">
        <span data-experience-light-step="1"></span>
        <span data-experience-light-step="2"></span>
        <span data-experience-light-step="3"></span>
      </section>
    `
    const section = document.querySelector<HTMLElement>('.experience-section')!
    const steps = Array.from(
      document.querySelectorAll<HTMLElement>('[data-experience-light-step]'),
    )
    const tops = [400, 600, 800]
    steps.forEach((step, index) => {
      vi.spyOn(step, 'getBoundingClientRect').mockImplementation(() => ({
        bottom: tops[index] + 1,
        height: 1,
        left: 0,
        right: 1,
        top: tops[index],
        width: 1,
        x: 0,
        y: tops[index],
        toJSON: () => undefined,
      }))
    })
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    let update: IntersectionObserverCallback | undefined
    const observer = {
      disconnect: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
    } as unknown as IntersectionObserver
    const cleanup = setupExperienceChapter(document, window, false, (callback) => {
      update = callback
      return observer
    })

    expect(document.documentElement).toHaveClass('atlas-experience-fallback')
    expect(observer.observe).toHaveBeenCalledTimes(3)
    expect(section.style.getPropertyValue('--atlas-experience-darkness')).toBe('0.0907')
    expect(section.style.getPropertyValue('--atlas-experience-warmth')).toBe('0.0911')

    tops[1] = 480
    update?.([], observer)
    expect(section.style.getPropertyValue('--atlas-experience-darkness')).toBe('0.2593')
    expect(section.style.getPropertyValue('--atlas-experience-warmth')).toBe('0.1489')

    cleanup()
    expect(document.documentElement).not.toHaveClass('atlas-experience-fallback')
    expect(section.style.getPropertyValue('--atlas-experience-darkness')).toBe('')
  })

  it('sets one active nav link from the four observed narrative sections', () => {
    document.body.innerHTML = `
      <nav>
        <div class="nav-links">
          <a href="#experience">Experience</a><a href="#projects">Projects</a>
          <a href="#craft">Craft</a><a href="#contact">Contact</a>
        </div>
      </nav>
      <section id="experience"></section><section id="projects"></section>
      <section id="craft"></section><section id="contact"></section>
    `
    const observed: Element[] = []
    let update: IntersectionObserverCallback | undefined
    const cleanup = setupSectionWayfinding(document, (callback) => {
      update = callback
      return {
        disconnect: vi.fn(),
        observe: (target: Element) => observed.push(target),
        unobserve: vi.fn(),
      } as unknown as IntersectionObserver
    })

    update?.([
      { boundingClientRect: { top: 100 }, isIntersecting: true, target: observed[0] },
    ] as IntersectionObserverEntry[], {} as IntersectionObserver)
    expect(document.querySelector('a[href="#experience"]')).toHaveAttribute('aria-current', 'true')

    update?.([
      { boundingClientRect: { top: -100 }, isIntersecting: false, target: observed[0] },
      { boundingClientRect: { top: 120 }, isIntersecting: true, target: observed[1] },
    ] as IntersectionObserverEntry[], {} as IntersectionObserver)
    expect(document.querySelector('a[href="#experience"]')).not.toHaveAttribute('aria-current')
    expect(document.querySelector('a[href="#projects"]')).toHaveAttribute('aria-current', 'true')
    cleanup()
  })

  it('does no enhancement work when reduced motion is requested', () => {
    const createBus = vi.fn()
    const createEngine = vi.fn()
    const prepareEntrance = vi.fn()
    const prepareHero = vi.fn()
    const prepareCraft = vi.fn()
    const prepareContact = vi.fn()
    const prepareCursor = vi.fn()
    const prepareMetrics = vi.fn()
    const prepareMagnetic = vi.fn()
    const prepareMarquee = vi.fn()
    const cleanupLocalTime = vi.fn()
    const prepareLocalTime = vi.fn(() => cleanupLocalTime)
    const prepareProjects = vi.fn()
    const preparePrintReveals = vi.fn()
    const prepareScramble = vi.fn()
    const prepareVelocityPlates = vi.fn()
    const prepareWipes = vi.fn()
    const cleanupDossiers = vi.fn()
    const prepareDossiers = vi.fn(() => cleanupDossiers)
    const prepareExperience = vi.fn()
    const prepareReveals = vi.fn()
    const cleanupWayfinding = vi.fn()
    const prepareSun = vi.fn()
    const prepareWayfinding = vi.fn(() => cleanupWayfinding)
    const matchMedia = vi.fn(() => ({ matches: true }))

    const cleanup = initializeAtlas({
      createBus,
      createEngine,
      document,
      matchMedia,
      prepareEntrance,
      prepareHero,
      prepareCraft,
      prepareContact,
      prepareCursor,
      prepareDossiers,
      prepareMetrics,
      prepareMagnetic,
      prepareMarquee,
      prepareLocalTime,
      prepareProjects,
      preparePrintReveals,
      prepareExperience,
      prepareReveals,
      prepareSun,
      prepareScramble,
      prepareVelocityPlates,
      prepareWipes,
      prepareWayfinding,
      window,
    })

    expect(document.documentElement).not.toHaveClass('atlas-js')
    expect(document.documentElement).not.toHaveAttribute('data-atlas')
    expect(createBus).not.toHaveBeenCalled()
    expect(createEngine).not.toHaveBeenCalled()
    expect(prepareEntrance).not.toHaveBeenCalled()
    expect(prepareHero).not.toHaveBeenCalled()
    expect(prepareCraft).not.toHaveBeenCalled()
    expect(prepareContact).not.toHaveBeenCalled()
    expect(prepareCursor).not.toHaveBeenCalled()
    expect(prepareMetrics).not.toHaveBeenCalled()
    expect(prepareMagnetic).not.toHaveBeenCalled()
    expect(prepareMarquee).not.toHaveBeenCalled()
    expect(prepareLocalTime).toHaveBeenCalledOnce()
    expect(prepareProjects).not.toHaveBeenCalled()
    expect(preparePrintReveals).not.toHaveBeenCalled()
    expect(prepareScramble).not.toHaveBeenCalled()
    expect(prepareVelocityPlates).not.toHaveBeenCalled()
    expect(prepareWipes).not.toHaveBeenCalled()
    expect(prepareDossiers).toHaveBeenCalledOnce()
    expect(prepareExperience).not.toHaveBeenCalled()
    expect(prepareReveals).not.toHaveBeenCalled()
    expect(prepareSun).not.toHaveBeenCalled()
    expect(prepareWayfinding).toHaveBeenCalledOnce()
    cleanup()
    expect(cleanupDossiers).toHaveBeenCalledOnce()
    expect(cleanupLocalTime).toHaveBeenCalledOnce()
    expect(cleanupWayfinding).toHaveBeenCalledOnce()
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
    const cleanupEntrance = vi.fn()
    const cleanupHero = vi.fn()
    const cleanupCraft = vi.fn()
    const cleanupContact = vi.fn()
    const cleanupCursor = vi.fn()
    const cleanupMetrics = vi.fn()
    const cleanupDossiers = vi.fn()
    const cleanupExperience = vi.fn()
    const cleanupSun = vi.fn()
    const cleanupMagnetic = vi.fn()
    const cleanupMarquee = vi.fn()
    const cleanupLocalTime = vi.fn()
    const cleanupProjects = vi.fn()
    const cleanupPrintReveals = vi.fn()
    const cleanupScramble = vi.fn()
    const cleanupVelocityPlates = vi.fn()
    const cleanupWipes = vi.fn()
    const cleanupWayfinding = vi.fn()
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
      prepareEntrance: () => cleanupEntrance,
      prepareHero: () => cleanupHero,
      prepareCraft: () => cleanupCraft,
      prepareContact: () => cleanupContact,
      prepareCursor: () => cleanupCursor,
      prepareDossiers: () => cleanupDossiers,
      prepareMetrics: () => cleanupMetrics,
      prepareMagnetic: () => cleanupMagnetic,
      prepareMarquee: () => cleanupMarquee,
      prepareLocalTime: () => cleanupLocalTime,
      prepareProjects: () => cleanupProjects,
      preparePrintReveals: () => cleanupPrintReveals,
      prepareExperience: () => cleanupExperience,
      prepareReveals: () => cleanupReveals,
      prepareSun: () => cleanupSun,
      prepareScramble: () => cleanupScramble,
      prepareVelocityPlates: () => cleanupVelocityPlates,
      prepareWipes: () => cleanupWipes,
      prepareWayfinding: () => cleanupWayfinding,
      window,
    })
    subscriber?.({ documentProgress: 0.5, scrollY: 500 })
    destroy()
    destroy()

    expect(document.documentElement).toHaveClass('atlas-js')
    expect(document.documentElement).toHaveAttribute('data-atlas', 'ready')
    expect(createBus).toHaveBeenCalledWith(engine)
    expect(refreshScrollTrigger).toHaveBeenCalled()
    expect(observeLayout).toHaveBeenCalledWith(document.documentElement)
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'atlas:scroll' }))
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(cleanupEntrance).toHaveBeenCalledOnce()
    expect(cleanupHero).toHaveBeenCalledOnce()
    expect(cleanupCraft).toHaveBeenCalledOnce()
    expect(cleanupContact).toHaveBeenCalledOnce()
    expect(cleanupCursor).toHaveBeenCalledOnce()
    expect(cleanupMetrics).toHaveBeenCalledOnce()
    expect(cleanupDossiers).toHaveBeenCalledOnce()
    expect(cleanupExperience).toHaveBeenCalledOnce()
    expect(cleanupSun).toHaveBeenCalledOnce()
    expect(cleanupMagnetic).toHaveBeenCalledOnce()
    expect(cleanupMarquee).toHaveBeenCalledOnce()
    expect(cleanupLocalTime).toHaveBeenCalledOnce()
    expect(cleanupProjects).toHaveBeenCalledOnce()
    expect(cleanupPrintReveals).toHaveBeenCalledOnce()
    expect(cleanupScramble).toHaveBeenCalledOnce()
    expect(cleanupVelocityPlates).toHaveBeenCalledOnce()
    expect(cleanupWipes).toHaveBeenCalledOnce()
    expect(cleanupWayfinding).toHaveBeenCalledOnce()
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
      lenis: { scroll: 1000 },
    }
    const subscriber = vi.fn()

    const bus = createScrollBus({
      document,
      engine: engine as never,
      window,
    })
    const unsubscribe = bus.subscribe(subscriber)
    onUpdate?.()
    unsubscribe()
    bus.destroy()

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      end: 'max',
      start: 0,
      trigger: document.documentElement,
    }))
    expect(subscriber).toHaveBeenLastCalledWith({ documentProgress: 0.5, scrollY: 1000 })
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
