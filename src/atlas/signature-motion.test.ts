import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AtlasEngine } from './engine'
import { setupMagnetic } from './magnetic'
import { setupScrambleWayfinding } from './wayfinding'
import { setupCursor } from './cursor'

function createSignatureHarness() {
  const triggers: Array<{ kill: ReturnType<typeof vi.fn>; vars: Record<string, unknown> }> = []
  const quickSetters: Array<ReturnType<typeof vi.fn>> = []
  const quickTargets: Array<{ property: string; setter: ReturnType<typeof vi.fn>; target: unknown }> = []
  const tweens: Array<{ kill: ReturnType<typeof vi.fn>; vars: Record<string, unknown> }> = []
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
  const splitCreate = vi.fn((target: Element) => ({
    chars: Array.from(target.textContent ?? '').map(() => document.createElement('span')),
    revert: vi.fn(),
  }))
  const flipState = { id: 'state' }
  const flipAnimation = { kill: vi.fn() }
  const flipGetState = vi.fn(() => flipState)
  const flipFrom = vi.fn(() => flipAnimation)
  const set = vi.fn()
  const engine = {
    ScrollTrigger: { create, refresh: vi.fn() },
    gsap: { quickSetter, quickTo, set, to },
    isCoarsePointer: false,
    plugins: {
      Flip: { from: flipFrom, getState: flipGetState },
      SplitText: { create: splitCreate },
    },
  } as unknown as AtlasEngine

  return {
    create,
    engine,
    flipAnimation,
    flipFrom,
    flipGetState,
    quickSetters,
    quickTargets,
    splitCreate,
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

  it('decodes editorial labels without scrambling the persistent route index', () => {
    document.body.innerHTML = `
      <nav><a class="atlas-route-link" href="/skills">
        <span class="atlas-route-link__label">Skills</span>
      </a></nav>
      <p class="eyebrow">03 / Skills</p>
      <p class="art-caption">Plate 03</p>
    `
    const harness = createSignatureHarness()
    const cleanup = setupScrambleWayfinding(document, harness.engine)
    const nav = document.querySelector<HTMLElement>('.atlas-route-link__label')!

    expect(nav).not.toHaveAttribute('aria-label')
    expect(harness.triggers).toHaveLength(2)
    ;(harness.triggers[0].vars.onEnter as () => void)()
    expect(harness.to).toHaveBeenCalledWith(
      expect.any(Element),
      expect.objectContaining({
        duration: 0.45,
        scrambleText: expect.objectContaining({ chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 /·' }),
      }),
    )
    const decodeCount = harness.to.mock.calls.length
    nav.dispatchEvent(new MouseEvent('pointerenter'))
    expect(harness.to).toHaveBeenCalledTimes(decodeCount)
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

})
