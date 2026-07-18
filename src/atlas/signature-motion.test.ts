import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setupDossiers } from './experience'
import type { AtlasEngine } from './engine'
import { setupMagnetic } from './magnetic'
import { setupMarquee } from './marquee'
import { setupPrintReveals, setupVelocityPlates } from './plates'
import { setupScrambleWayfinding } from './wayfinding'
import { setupCursor } from './cursor'

function createSignatureHarness() {
  const triggers: Array<{ kill: ReturnType<typeof vi.fn>; vars: Record<string, unknown> }> = []
  const timelines: Array<Record<string, unknown>> = []
  const quickSetters: Array<ReturnType<typeof vi.fn>> = []
  const quickTargets: Array<{ property: string; setter: ReturnType<typeof vi.fn>; target: unknown }> = []
  const tweens: Array<{ kill: ReturnType<typeof vi.fn>; vars: Record<string, unknown> }> = []
  const delayed = { kill: vi.fn(), pause: vi.fn(), restart: vi.fn() }
  const create = vi.fn((vars: Record<string, unknown>) => {
    const trigger = { kill: vi.fn(), vars }
    triggers.push(trigger)
    return trigger
  })
  const quickTo = vi.fn((target: unknown, property: string) => {
    const setter = vi.fn() as ReturnType<typeof vi.fn> & { tween?: { kill: () => void } }
    setter.tween = { kill: vi.fn() }
    quickTargets.push({ property, setter, target })
    return setter
  })
  const quickSetter = vi.fn(() => {
    const setter = vi.fn()
    quickSetters.push(setter)
    return setter
  })
  const to = vi.fn((_target: unknown, vars: Record<string, unknown>) => {
    const tween = { kill: vi.fn(), vars }
    tweens.push(tween)
    return tween
  })
  const fromTo = vi.fn((_target: unknown, _from: unknown, vars: Record<string, unknown>) => {
    const tween = { kill: vi.fn(), vars }
    tweens.push(tween)
    return tween
  })
  const timeline = vi.fn((vars: Record<string, unknown> = {}) => {
    const instance: Record<string, unknown> = { vars }
    instance.fromTo = vi.fn(() => instance)
    instance.to = vi.fn(() => instance)
    instance.kill = vi.fn()
    instance.pause = vi.fn()
    instance.resume = vi.fn()
    instance.paused = vi.fn(() => false)
    instance.timeScale = vi.fn(() => instance)
    timelines.push(instance)
    return instance
  })
  const splitCreate = vi.fn((target: Element) => ({
    chars: Array.from(target.textContent ?? '').map(() => document.createElement('span')),
    revert: vi.fn(),
  }))
  const flipState = { id: 'state' }
  const flipAnimation = { kill: vi.fn() }
  const flipGetState = vi.fn(() => flipState)
  const flipFrom = vi.fn(() => flipAnimation)
  const set = vi.fn()
  const delayedCall = vi.fn(() => delayed)

  const engine = {
    ScrollTrigger: { create, refresh: vi.fn() },
    gsap: { delayedCall, fromTo, quickSetter, quickTo, set, timeline, to },
    isCoarsePointer: false,
    plugins: {
      Flip: { from: flipFrom, getState: flipGetState },
      SplitText: { create: splitCreate },
    },
  } as unknown as AtlasEngine

  return {
    create,
    delayed,
    engine,
    flipAnimation,
    flipFrom,
    flipGetState,
    fromTo,
    quickSetters,
    quickTargets,
    splitCreate,
    timeline,
    timelines,
    to,
    triggers,
    tweens,
  }
}

describe('Phase C signature motion', () => {
  beforeEach(() => {
    document.documentElement.className = 'atlas-js'
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deforms marked plates from ScrollTrigger velocity and returns them to rest', () => {
    document.body.innerHTML = `
      <div data-atlas-velocity-plate></div>
      <div data-atlas-velocity-plate></div>
    `
    const harness = createSignatureHarness()
    const cleanup = setupVelocityPlates(document, harness.engine)

    expect(harness.quickTargets.map(({ property }) => property)).toEqual([
      '--atlas-plate-skew', '--atlas-plate-scale',
      '--atlas-plate-skew', '--atlas-plate-scale',
    ])
    ;(harness.triggers[0].vars.onUpdate as (self: { getVelocity: () => number }) => void)({
      getVelocity: () => 1_200,
    })
    expect(harness.quickTargets[0].setter).toHaveBeenCalledWith(0.6)
    expect(harness.quickTargets[1].setter).toHaveBeenCalledWith(1.004)
    expect(harness.delayed.restart).toHaveBeenCalledWith(true)
    cleanup()
    expect(harness.triggers[0].kill).toHaveBeenCalledOnce()
  })

  it('scrubs print plates through a halftone dot custom property', () => {
    document.body.innerHTML = `
      <picture data-atlas-print-plate></picture>
      <picture data-atlas-print-plate></picture>
    `
    const harness = createSignatureHarness()
    const cleanup = setupPrintReveals(document, window, harness.engine)

    expect(harness.timelines).toHaveLength(2)
    expect(harness.timelines[0].fromTo).toHaveBeenCalledWith(
      document.querySelector('[data-atlas-print-plate]'),
      { '--atlas-print-dot': '0px' },
      expect.objectContaining({ '--atlas-print-dot': '10px', ease: 'none' }),
      0,
    )
    cleanup()
    expect(harness.timelines[0].kill).toHaveBeenCalledOnce()
  })

  it('decodes wayfinding once and repeats nav labels on hover', () => {
    document.body.innerHTML = `
      <nav class="nav-links"><a href="#craft">Skills</a></nav>
      <p class="eyebrow">03 / Skills</p>
      <p class="art-caption">Plate 03</p>
    `
    const harness = createSignatureHarness()
    const cleanup = setupScrambleWayfinding(document, harness.engine)
    const nav = document.querySelector<HTMLAnchorElement>('.nav-links a')!

    expect(nav).toHaveAttribute('aria-label', 'Skills')
    expect(harness.triggers).toHaveLength(2)
    ;(harness.triggers[0].vars.onEnter as () => void)()
    expect(harness.to).toHaveBeenCalledWith(
      expect.any(Element),
      expect.objectContaining({
        duration: 0.45,
        scrambleText: expect.objectContaining({ chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 /·' }),
      }),
    )
    nav.dispatchEvent(new MouseEvent('pointerenter'))
    expect(harness.to).toHaveBeenCalledWith(nav, expect.objectContaining({ duration: 0.45 }))
    cleanup()
  })

  it('runs a velocity-responsive marquee that pauses for hover and focus', () => {
    document.body.innerHTML = `
      <div data-craft-marquee tabindex="0"><div class="craft-marquee__track"></div></div>
    `
    const harness = createSignatureHarness()
    const cleanup = setupMarquee(document, harness.engine)
    const marquee = document.querySelector<HTMLElement>('[data-craft-marquee]')!
    const loop = harness.timelines[0]

    expect(loop.fromTo).toHaveBeenCalledWith(
      document.querySelector('.craft-marquee__track'),
      { xPercent: 0 },
      expect.objectContaining({ duration: 28, ease: 'none', repeat: -1, xPercent: -50 }),
    )
    ;(harness.triggers[0].vars.onUpdate as (self: { getVelocity: () => number }) => void)({
      getVelocity: () => 1_500,
    })
    expect(loop.timeScale).toHaveBeenCalledWith(1.75)
    marquee.dispatchEvent(new MouseEvent('pointerenter'))
    expect(loop.pause).toHaveBeenCalled()
    marquee.dispatchEvent(new MouseEvent('pointerleave'))
    expect(loop.resume).toHaveBeenCalled()
    cleanup()
  })

  it('uses quick setters for cursor states and quickTo for six-pixel magnets', () => {
    document.body.innerHTML = `
      <a data-magnetic href="https://example.com" target="_blank">Link</a>
      <picture data-cursor="read"></picture>
    `
    const magnet = document.querySelector<HTMLElement>('[data-magnetic]')!
    vi.spyOn(magnet, 'getBoundingClientRect').mockReturnValue({
      bottom: 100, height: 100, left: 0, right: 100, top: 0, width: 100, x: 0, y: 0,
      toJSON: () => undefined,
    })
    const harness = createSignatureHarness()
    const magneticCleanup = setupMagnetic(document, () => true, harness.engine)
    const cursorCleanup = setupCursor(document, () => true, harness.engine)
    const cursor = document.querySelector<HTMLElement>('[data-atlas-cursor]')!

    magnet.dispatchEvent(new MouseEvent('pointerenter'))
    magnet.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: -500 }))
    expect(harness.quickTargets.find(({ target, property }) => target === magnet && property === 'x')?.setter)
      .toHaveBeenCalledWith(6)
    document.querySelector('picture')?.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }))
    expect(cursor).toHaveAttribute('data-cursor-mode', 'read')
    expect(cursor.querySelector('[data-atlas-cursor-label]')).toHaveTextContent('read')
    expect(harness.quickSetters).toHaveLength(2)
    magneticCleanup()
    cursorCleanup()
  })

  it('opens dossiers with Flip and reveals SVG rules plus odometer indices', () => {
    document.body.innerHTML = `
      <ol class="flight-log"><li class="flight-entry">
        <p class="flight-index">01</p>
        <svg><line data-flight-rule x1="0" x2="100"></line></svg>
        <div data-dossier data-state="open" class="flight-dossier">
          <button class="flight-dossier__toggle" aria-controls="notes" aria-expanded="true">Notes</button>
          <div class="flight-dossier__panel" id="notes"><div class="flight-dossier__inner">Detail</div></div>
        </div>
      </li></ol>
    `
    const harness = createSignatureHarness()
    const cleanup = setupDossiers(document, harness.engine)
    const toggle = document.querySelector<HTMLButtonElement>('.flight-dossier__toggle')!

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(harness.splitCreate).toHaveBeenCalledWith(
      document.querySelector('.flight-index'),
      expect.objectContaining({ aria: 'auto', type: 'chars' }),
    )
    expect(harness.triggers).toHaveLength(2)
    ;(harness.triggers[0].vars.onEnter as () => void)()
    expect(harness.fromTo).toHaveBeenCalledWith(
      document.querySelector('[data-flight-rule]'),
      { drawSVG: '0%' },
      expect.objectContaining({ drawSVG: '100%' }),
    )
    toggle.click()
    expect(harness.flipGetState).toHaveBeenCalled()
    expect(harness.flipFrom).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ duration: 0.48, ease: 'power3.inOut' }),
    )
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    cleanup()
    expect(harness.flipAnimation.kill).toHaveBeenCalled()
  })
})
