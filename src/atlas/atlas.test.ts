import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { countUp } from './count-up'
import { setupChapterWipes } from './chapter-wipe'
import { setupContactFinale } from './contact'
import { setupCraftChapter } from './craft'
import { setupCursor } from './cursor'
import { setupEntrance, setupHeroParallax, setupMetricCountUps } from './hero'
import { setupExperienceChapter } from './experience'
import { setupLocalTime } from './local-time'
import { setupMagnetic } from './magnetic'
import { setupProjectPans } from './projects'
import { setupReveals } from './reveal'
import { initializeAtlas } from './runtime'
import { createScrollBus, type ScrollSnapshot } from './scroll-bus'
import { splitText } from './split-text'
import { setupSectionWayfinding, setupSunArc, SUN_PROGRESS_EVENT } from './sun-arc'

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

  it('renders a complete metric synchronously when duration is zero', () => {
    const metric = document.createElement('strong')
    metric.textContent = '616K+'

    countUp(metric, '616K+', { durationMs: 0 })

    expect(metric.textContent).toBe('616K+')
  })

  it('plays the entrance once per session and clears its start state at 1.2 seconds', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<h1 data-atlas-masthead>Brett Haas</h1>'
    const storage = new Map<string, string>()
    const session = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    }

    const cleanup = setupEntrance(document, session)

    expect(document.documentElement).toHaveClass('atlas-entering')
    expect(document.querySelectorAll('.atlas-split-token')).toHaveLength(9)
    expect(storage.get('atlas-entered')).toBe('1')
    vi.advanceTimersByTime(1200)
    expect(document.documentElement).not.toHaveClass('atlas-entering')
    expect(document.documentElement).toHaveClass('atlas-entered')
    cleanup()

    document.documentElement.className = ''
    document.body.innerHTML = '<h1 data-atlas-masthead>Brett Haas</h1>'
    setupEntrance(document, session)
    expect(document.documentElement).not.toHaveClass('atlas-entering')
    expect(document.querySelectorAll('.atlas-split-token')).toHaveLength(0)
    vi.useRealTimers()
  })

  it('counts metric values read from the rendered content and reveals sources afterward', () => {
    vi.useFakeTimers()
    document.body.innerHTML = `
      <div class="signal-strip">
        <div class="signal-metric"><strong data-atlas-count>12.5%</strong><small>Alpha</small></div>
        <div class="signal-metric"><strong data-atlas-count>7K+</strong><small>Beta</small></div>
      </div>
    `
    const observed: Element[] = []
    const unobserve = vi.fn()
    let reveal: (() => void) | undefined
    const animate = vi.fn((_element: HTMLElement, _target: string) => vi.fn())
    const cleanup = setupMetricCountUps(
      document,
      (callback) => {
        reveal = () => callback(
          observed.map((target) => ({ isIntersecting: true, target }) as IntersectionObserverEntry),
          {} as IntersectionObserver,
        )
        return {
          disconnect: vi.fn(),
          observe: (target: Element) => observed.push(target),
          unobserve,
        } as unknown as IntersectionObserver
      },
      animate,
    )

    expect(observed).toHaveLength(1)
    reveal?.()
    expect(animate.mock.calls.map(([, target]) => target)).toEqual(['12.5%', '7K+'])
    expect(unobserve).toHaveBeenCalledOnce()
    expect(document.querySelector('.signal-strip')).toHaveClass('is-counting')
    vi.advanceTimersByTime(900)
    expect(document.querySelector('.signal-strip')).toHaveClass('is-counted')
    cleanup()
    vi.useRealTimers()
  })

  it('writes fallback hero transforms from the shared scroll event without layout reads per frame', () => {
    document.body.innerHTML = `
      <div class="hero-art"><picture class="atlas-picture--hero"></picture><p class="art-caption"></p></div>
    `
    const hero = document.querySelector<HTMLElement>('.hero-art')!
    vi.spyOn(hero, 'getBoundingClientRect').mockReturnValue({
      bottom: 800,
      height: 700,
      left: 0,
      right: 1000,
      top: 100,
      width: 1000,
      x: 0,
      y: 100,
      toJSON: () => undefined,
    })

    const cleanup = setupHeroParallax(document, window, false)
    window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { scrollY: 450 } }))

    expect(document.documentElement).toHaveClass('atlas-hero-fallback')
    expect(hero.style.getPropertyValue('--atlas-hero-image-y')).toBe('5.35%')
    expect(hero.style.getPropertyValue('--atlas-hero-caption-y')).toBe('-1.25vh')
    expect(hero.style.getPropertyValue('--atlas-hero-scale')).toBe('1.025')
    expect(hero.getBoundingClientRect).toHaveBeenCalledOnce()
    cleanup()
  })

  it('moves the header sun from shared progress and publishes the Step 7 handshake', () => {
    document.body.innerHTML = `
      <svg><g data-atlas-sun></g></svg>
      <section id="experience"></section>
    `
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent')
    const cleanup = setupSunArc(document, window, () => 0.4)

    window.dispatchEvent(new CustomEvent('atlas:scroll', {
      detail: { documentProgress: 0.4, scrollY: 1000 },
    }))

    expect(document.querySelector('[data-atlas-sun]')).toHaveAttribute(
      'transform',
      'translate(112 -14)',
    )
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: SUN_PROGRESS_EVENT }))
    cleanup()
  })

  it('moves the current header sun when hydration replaces the original SVG node', () => {
    document.body.innerHTML = `
      <svg><g data-atlas-sun transform="translate(0 0)"></g></svg>
      <section id="experience"></section>
    `
    const originalSun = document.querySelector('[data-atlas-sun]')!
    const cleanup = setupSunArc(document, window, () => 0.4)

    originalSun.replaceWith(originalSun.cloneNode(true))
    window.dispatchEvent(new CustomEvent('atlas:scroll', {
      detail: { documentProgress: 0.4, scrollY: 1000 },
    }))

    expect(document.querySelector('[data-atlas-sun]')).toHaveAttribute(
      'transform',
      'translate(112 -14)',
    )
    cleanup()
  })

  it('scrubs the contact glow, word reveal, and centered character exhale from shared progress', () => {
    document.body.innerHTML = `
      <section id="contact" data-contact-finale>
        <span data-contact-sunrise></span>
        <h2 data-contact-title>Keep building.</h2>
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

    expect(characters).toHaveLength(13)
    expect(words).toHaveLength(2)
    window.dispatchEvent(new CustomEvent(SUN_PROGRESS_EVENT, { detail: { progress: 0.98 } }))
    window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { scrollY: 2200 } }))

    expect(section.style.getPropertyValue('--atlas-contact-glow')).toBe('1')
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
    expect(section.style.getPropertyValue('--atlas-contact-glow')).toBe('')
  })

  it('renders Charlottesville time without depending on the viewer timezone', () => {
    document.body.innerHTML = '<p data-atlas-local-time>Charlottesville, VA</p>'
    const schedule = vi.fn(() => 17)
    const clear = vi.fn()
    const cleanup = setupLocalTime(
      document,
      () => new Date('2026-07-15T12:34:00.000Z'),
      schedule,
      clear,
    )

    expect(document.querySelector('[data-atlas-local-time]')).toHaveTextContent(
      'Charlottesville, VA — 08:34',
    )
    expect(schedule).toHaveBeenCalledWith(expect.any(Function), 60_000)
    cleanup()
    expect(clear).toHaveBeenCalledWith(17)
  })

  it('creates a fine-pointer cursor with external, dossier, and plate modes only', () => {
    document.body.innerHTML = `
      <a id="external" href="https://example.com" target="_blank">External</a>
      <button id="dossier" data-cursor="expand">Field notes</button>
      <picture id="plate" data-cursor="read"></picture>
    `
    const frames: FrameRequestCallback[] = []
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    const cleanup = setupCursor(document, () => true, requestFrame, vi.fn())
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
    expect(cursor).toHaveAttribute('data-cursor-mode', 'read')
    expect(cursor.querySelector('[data-atlas-cursor-label]')).toHaveTextContent('read')
    cleanup()
    expect(document.querySelector('[data-atlas-cursor]')).not.toBeInTheDocument()

    const touchCleanup = setupCursor(document, () => false, requestFrame, vi.fn())
    expect(document.querySelector('[data-atlas-cursor]')).not.toBeInTheDocument()
    touchCleanup()
  })

  it('provides an IO wipe and scroll-scrubbed Craft fallback', () => {
    document.body.innerHTML = `
      <section class="craft-section">
        <span data-craft-ghost></span>
        <picture class="craft-art"><img /></picture>
      </section>
    `
    const section = document.querySelector<HTMLElement>('.craft-section')!
    const plate = document.querySelector<HTMLElement>('.craft-art')!
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    vi.spyOn(plate, 'getBoundingClientRect').mockReturnValue({
      bottom: 2900,
      height: 900,
      left: 0,
      right: 1200,
      top: 2000,
      width: 1200,
      x: 0,
      y: 2000,
      toJSON: () => undefined,
    })
    const cleanup = setupCraftChapter(document, window, false)

    expect(document.documentElement).toHaveClass('atlas-craft-fallback')

    window.dispatchEvent(new CustomEvent('atlas:scroll', { detail: { scrollY: 1702.5 } }))
    expect(plate.style.getPropertyValue('--atlas-craft-clip-bottom')).toBe('50%')
    expect(plate.style.getPropertyValue('--atlas-craft-image-y')).toBe('0%')
    expect(section.style.getPropertyValue('--atlas-craft-ghost-y')).toBe('0px')

    cleanup()
    expect(document.documentElement).not.toHaveClass('atlas-craft-fallback')
  })

  it('reveals Craft and project page turns through one shared IO fallback', () => {
    document.body.innerHTML = `
      <section data-chapter-wipe></section>
      <article data-chapter-wipe></article>
      <article data-chapter-wipe></article>
      <article data-chapter-wipe></article>
    `
    const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter-wipe]'))
    let update: IntersectionObserverCallback | undefined
    const observer = {
      disconnect: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
    } as unknown as IntersectionObserver
    const cleanup = setupChapterWipes(document, false, (callback) => {
      update = callback
      return observer
    })

    expect(document.documentElement).toHaveClass('atlas-chapter-wipe-fallback')
    expect(observer.observe).toHaveBeenCalledTimes(4)
    update?.(
      [{ isIntersecting: true, target: chapters[1] }] as unknown as IntersectionObserverEntry[],
      observer,
    )
    expect(chapters[1]).toHaveClass('is-chapter-visible')
    expect(observer.unobserve).toHaveBeenCalledWith(chapters[1])
    cleanup()
    expect(document.documentElement).not.toHaveClass('atlas-chapter-wipe-fallback')
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
    const frames: FrameRequestCallback[] = []
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    const cancelFrame = vi.fn()
    const cleanup = setupMagnetic(document, () => true, requestFrame, cancelFrame)

    link.dispatchEvent(new MouseEvent('pointerenter', { clientX: 50, clientY: 50 }))
    link.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: -500 }))
    for (let index = 0; index < 30 && frames.length > 0; index += 1) frames.shift()?.(index)

    expect(Number.parseFloat(link.style.getPropertyValue('--atlas-magnet-x'))).toBeLessThanOrEqual(6)
    expect(Number.parseFloat(link.style.getPropertyValue('--atlas-magnet-y'))).toBeGreaterThanOrEqual(-6)
    expect(link).toHaveAttribute('data-magnetic-ready')
    cleanup()
    expect(link).not.toHaveAttribute('data-magnetic-ready')

    const touchCleanup = setupMagnetic(document, () => false, requestFrame, cancelFrame)
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
    const prepareEntrance = vi.fn()
    const prepareHero = vi.fn()
    const prepareCraft = vi.fn()
    const prepareContact = vi.fn()
    const prepareCursor = vi.fn()
    const prepareMetrics = vi.fn()
    const prepareMagnetic = vi.fn()
    const cleanupLocalTime = vi.fn()
    const prepareLocalTime = vi.fn(() => cleanupLocalTime)
    const prepareProjects = vi.fn()
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
      prepareLocalTime,
      prepareProjects,
      prepareExperience,
      prepareReveals,
      prepareSun,
      prepareWipes,
      prepareWayfinding,
      window,
    })

    expect(document.documentElement).not.toHaveClass('atlas-js')
    expect(document.documentElement).not.toHaveAttribute('data-atlas')
    expect(createBus).not.toHaveBeenCalled()
    expect(prepareEntrance).not.toHaveBeenCalled()
    expect(prepareHero).not.toHaveBeenCalled()
    expect(prepareCraft).not.toHaveBeenCalled()
    expect(prepareContact).not.toHaveBeenCalled()
    expect(prepareCursor).not.toHaveBeenCalled()
    expect(prepareMetrics).not.toHaveBeenCalled()
    expect(prepareMagnetic).not.toHaveBeenCalled()
    expect(prepareLocalTime).toHaveBeenCalledOnce()
    expect(prepareProjects).not.toHaveBeenCalled()
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
    const cleanupLocalTime = vi.fn()
    const cleanupProjects = vi.fn()
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
      prepareLocalTime: () => cleanupLocalTime,
      prepareProjects: () => cleanupProjects,
      prepareExperience: () => cleanupExperience,
      prepareReveals: () => cleanupReveals,
      prepareSun: () => cleanupSun,
      prepareWipes: () => cleanupWipes,
      prepareWayfinding: () => cleanupWayfinding,
      window,
    })
    subscriber?.({ documentProgress: 0.5, scrollY: 500 })
    destroy()
    destroy()

    expect(document.documentElement).toHaveClass('atlas-js')
    expect(document.documentElement).toHaveAttribute('data-atlas', 'ready')
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
    expect(cleanupLocalTime).toHaveBeenCalledOnce()
    expect(cleanupProjects).toHaveBeenCalledOnce()
    expect(cleanupWipes).toHaveBeenCalledOnce()
    expect(cleanupWayfinding).toHaveBeenCalledOnce()
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
