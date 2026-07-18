import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setupChapterWipes } from './chapter-wipe'
import { setupCraftChapter } from './craft'
import type { AtlasEngine } from './engine'
import { setupMetricCountUps } from './hero'
import { setupSunArc, SUN_PROGRESS_EVENT } from './sun-arc'

interface RecordedTween {
  readonly kill: ReturnType<typeof vi.fn>
  readonly target: unknown
  readonly vars: Record<string, unknown>
}

function createMotionHarness({ coarse = false }: { coarse?: boolean } = {}) {
  const timelines: Array<Record<string, unknown>> = []
  const tweens: RecordedTween[] = []
  const triggers: Array<{ kill: ReturnType<typeof vi.fn>; vars: Record<string, unknown> }> = []
  const splitCreate = vi.fn()
  const set = vi.fn()
  const to = vi.fn((target: unknown, vars: Record<string, unknown>) => {
    const tween = { kill: vi.fn(), target, vars }
    tweens.push(tween)
    return tween
  })
  const timeline = vi.fn((vars: Record<string, unknown> = {}) => {
    const instance: Record<string, unknown> = { vars }
    instance.fromTo = vi.fn(() => instance)
    instance.to = vi.fn(() => instance)
    instance.set = vi.fn(() => instance)
    instance.kill = vi.fn()
    instance.scrollTrigger = { kill: vi.fn() }
    timelines.push(instance)
    return instance
  })
  const create = vi.fn((vars: Record<string, unknown>) => {
    const trigger = { kill: vi.fn(), vars }
    triggers.push(trigger)
    return trigger
  })

  const engine = {
    ScrollTrigger: { create },
    gsap: { set, timeline, to },
    isCoarsePointer: coarse,
    plugins: {
      SplitText: { create: splitCreate },
    },
  } as unknown as AtlasEngine

  return { create, engine, set, splitCreate, timelines, to, triggers, tweens }
}

describe('GSAP Atlas choreography', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('counts rendered metrics with snap before settling ink and sources', () => {
    document.body.innerHTML = `
      <div class="signal-strip">
        <div><strong data-atlas-count>12.5%</strong><small>Alpha</small></div>
        <div><strong data-atlas-count>7K+</strong><small>Beta</small></div>
      </div>
    `
    const harness = createMotionHarness()
    const cleanup = setupMetricCountUps(document, harness.engine)

    expect(harness.triggers[0].vars).toMatchObject({
      once: true,
      start: 'top 72%',
      trigger: document.querySelector('.signal-strip'),
    })
    ;(harness.triggers[0].vars.onEnter as () => void)()
    const countTweens = harness.tweens.filter(({ vars }) => 'snap' in vars)
    expect(countTweens).toHaveLength(2)
    expect(countTweens[0].vars).toMatchObject({
      duration: 0.9,
      snap: { progress: 1 / 30 },
    })

    ;(countTweens[0].target as { progress: number }).progress = 0.5
    ;(countTweens[0].vars.onUpdate as () => void)()
    expect(document.querySelectorAll('[data-atlas-count]')[0]).toHaveTextContent('6.3%')
    countTweens.forEach(({ vars }) => (vars.onComplete as () => void)())
    expect(document.querySelector('.signal-strip')).toHaveClass('is-counted')
    expect(harness.to).toHaveBeenCalledWith(
      Array.from(document.querySelectorAll('small')),
      expect.objectContaining({ opacity: 1, stagger: 0.07, y: 0 }),
    )

    cleanup()
    expect(harness.triggers[0].kill).toHaveBeenCalledOnce()
  })

  it('scrubs alternating chapter layers like opposing page turns', () => {
    document.body.innerHTML = `
      <section data-chapter-wipe></section>
      <section data-chapter-wipe></section>
      <section data-chapter-wipe data-wipe-direction="ltr"></section>
    `
    const harness = createMotionHarness()
    const cleanup = setupChapterWipes(document, harness.engine)
    const layers = Array.from(document.querySelectorAll('.chapter-wipe__layer'))

    expect(layers).toHaveLength(3)
    expect(harness.timelines).toHaveLength(3)
    expect(harness.timelines[0].vars).toMatchObject({
      scrollTrigger: { refreshPriority: 1 },
    })
    expect(harness.timelines[0].fromTo).toHaveBeenCalledWith(
      layers[0],
      { '--chapter-dot-radius': '0px', '--chapter-dot-x': '12px' },
      expect.objectContaining({
        '--chapter-dot-radius': '9px',
        '--chapter-dot-x': '0px',
        ease: 'none',
      }),
      0,
    )
    expect(harness.timelines[1].fromTo).toHaveBeenCalledWith(
      layers[1],
      { '--chapter-dot-radius': '0px', '--chapter-dot-x': '-12px' },
      expect.objectContaining({
        '--chapter-dot-radius': '9px',
        '--chapter-dot-x': '0px',
        ease: 'none',
      }),
      0,
    )
    cleanup()
    expect(document.querySelectorAll('.chapter-wipe__layer')).toHaveLength(0)
  })

  it('pins the Craft heading on fine pointers while scrubbing its plate and ghost numeral', () => {
    document.body.innerHTML = `
      <section class="craft-section">
        <div class="craft-panel"><div class="craft-narrative">
          <div class="craft-heading"><span class="craft-ghost"></span></div>
          <div class="craft-copy"></div>
        </div></div>
        <picture class="craft-art"><img /></picture>
      </section>
    `
    const harness = createMotionHarness()
    const panel = document.querySelector<HTMLElement>('.craft-panel')!
    const headingElement = document.querySelector<HTMLElement>('.craft-heading')!
    const copyElement = document.querySelector<HTMLElement>('.craft-copy')!
    Object.defineProperty(headingElement, 'offsetHeight', {
      configurable: true,
      value: 300,
    })
    Object.defineProperty(headingElement, 'offsetTop', { configurable: true, value: 100 })
    Object.defineProperty(copyElement, 'offsetTop', { configurable: true, value: 448 })
    const cleanup = setupCraftChapter(document, window, harness.engine)
    const heading = document.querySelector('.craft-heading')
    const plate = document.querySelector('.craft-art')
    const ghost = document.querySelector('.craft-ghost')
    const plateTimeline = harness.timelines.find(({ vars }) => (
      (vars as { scrollTrigger?: { trigger?: Element } }).scrollTrigger?.trigger === plate
    ))!
    const ghostTimeline = harness.timelines.find(({ vars }) => (
      (vars as { scrollTrigger?: { trigger?: Element } }).scrollTrigger?.trigger === document.querySelector('.craft-section')
    ))!

    expect(harness.create).toHaveBeenCalledWith(expect.objectContaining({
      pin: heading,
      pinSpacing: false,
      refreshPriority: -1,
      trigger: panel,
    }))
    const pinVars = harness.create.mock.calls[0][0]
    expect((pinVars.end as () => string)()).toBe('+=24')
    expect(plateTimeline.fromTo).toHaveBeenCalledWith(
      plate,
      { clipPath: 'inset(0 0 100%)' },
      expect.objectContaining({ clipPath: 'inset(0 0 0%)', ease: 'none' }),
      0,
    )
    expect(plateTimeline.vars).toMatchObject({ scrollTrigger: { refreshPriority: 1 } })
    expect(ghostTimeline.vars).toMatchObject({ scrollTrigger: { refreshPriority: 1 } })
    expect(ghostTimeline.fromTo).toHaveBeenCalledWith(
      ghost,
      { y: 28 },
      expect.objectContaining({ ease: 'none', y: -28 }),
      0,
    )
    cleanup()
    expect(harness.triggers[0].kill).toHaveBeenCalledOnce()
  })

  it('keeps the Craft scrub but skips pin accounting at the mobile layout breakpoint', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390)
    document.body.innerHTML = `
      <section class="craft-section">
        <div class="craft-panel"><div class="craft-narrative">
          <div class="craft-heading"><span class="craft-ghost"></span></div>
        </div></div>
        <picture class="craft-art"><img /></picture>
      </section>
    `
    const harness = createMotionHarness()

    const cleanup = setupCraftChapter(document, window, harness.engine)

    expect(harness.create).not.toHaveBeenCalled()
    expect(harness.timelines).toHaveLength(2)
    cleanup()
  })

  it('draws the real SVG arc and moves the sun along the same path', () => {
    document.body.innerHTML = `
      <svg>
        <path data-atlas-sun-path d="M8 23 Q120 -5 232 23"></path>
        <g data-atlas-sun></g>
      </svg>
      <section id="experience"></section>
    `
    const harness = createMotionHarness()
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent')
    const cleanup = setupSunArc(document, window, () => 0.4, harness.engine)
    const arc = harness.timelines[0]
    const path = document.querySelector('[data-atlas-sun-path]')
    const sun = document.querySelector('[data-atlas-sun]')

    expect(arc.vars).toMatchObject({
      scrollTrigger: expect.objectContaining({ end: 'max', scrub: 0.5, start: 0 }),
    })
    expect(arc.fromTo).toHaveBeenCalledWith(
      path,
      { drawSVG: '0%' },
      expect.objectContaining({ drawSVG: '100%', ease: 'none' }),
      0,
    )
    expect(arc.to).toHaveBeenCalledWith(
      sun,
      expect.objectContaining({
        ease: 'none',
        motionPath: expect.objectContaining({
          align: path,
          autoRotate: false,
          path,
        }),
      }),
      0,
    )

    window.dispatchEvent(new CustomEvent('atlas:scroll', {
      detail: { documentProgress: 0.4, scrollY: 1000 },
    }))
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: SUN_PROGRESS_EVENT }))
    cleanup()
    expect(arc.kill).toHaveBeenCalledOnce()
  })
})
