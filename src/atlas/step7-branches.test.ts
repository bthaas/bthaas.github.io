import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getContactCharacterOffsetEm,
  getContactScrollProgress,
} from '../../lib/atlas-motion/contact-choreography'

import { setupContactFinale } from './contact'
import { setupCursor } from './cursor'
import type { AtlasEngine } from './engine'
import { setupLocalTime } from './local-time'

describe('Step 7 capability branches', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('handles zero-span contact metrics and a single character without motion', () => {
    const metrics = {
      elementHeight: 0,
      elementTop: 1000,
      viewportHeight: 1000,
    }

    expect(getContactScrollProgress({ ...metrics, scrollY: -1 })).toBe(0)
    expect(getContactScrollProgress({ ...metrics, scrollY: 0 })).toBe(1)
    expect(getContactCharacterOffsetEm(0, 1, 1)).toBe(0)
  })

  it('leaves missing contact and clock markup static', () => {
    expect(setupContactFinale(document, window)()).toBeUndefined()
    expect(setupLocalTime(document)()).toBeUndefined()
  })

  it('remeasures contact through load and resize observer lifecycles', () => {
    document.body.innerHTML = `
      <section data-contact-finale><h2 data-contact-title>Keep building.</h2></section>
    `
    const section = document.querySelector<HTMLElement>('[data-contact-finale]')!
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({
      bottom: 600,
      height: 600,
      left: 0,
      right: 1000,
      top: 0,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    })
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
    const observe = vi.fn()
    const disconnect = vi.fn()

    const cleanup = setupContactFinale(document, window, () => ({ observe, disconnect }))
    window.dispatchEvent(new Event('load'))
    window.dispatchEvent(new Event('atlas:sun-progress'))
    window.dispatchEvent(new CustomEvent('atlas:scroll'))

    expect(observe).toHaveBeenCalledWith(section)
    cleanup()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('settles the cursor trail, resets its mode, and hides on pointer leave', () => {
    document.body.innerHTML = '<span id="plain">Plain</span>'
    const quickTargets: Array<{
      property: string
      setter: ReturnType<typeof vi.fn> & { tween?: { kill: () => void } }
    }> = []
    const quickTo = vi.fn((_target: unknown, property: string) => {
      const setter = vi.fn() as ReturnType<typeof vi.fn> & { tween?: { kill: () => void } }
      setter.tween = { kill: vi.fn() }
      quickTargets.push({ property, setter })
      return setter
    })
    const engine = {
      gsap: {
        quickSetter: vi.fn(() => vi.fn()),
        quickTo,
        set: vi.fn(),
      },
    } as unknown as AtlasEngine
    const cleanup = setupCursor(document, () => true, engine)
    const plain = document.getElementById('plain')!
    const cursor = document.querySelector<HTMLElement>('[data-atlas-cursor]')!

    plain.dispatchEvent(new MouseEvent('pointermove', {
      bubbles: true,
      clientX: 120,
      clientY: 80,
    }))
    expect(cursor).toHaveClass('is-visible')
    expect(cursor).toHaveAttribute('data-cursor-mode', 'default')
    expect(quickTargets.find(({ property }) => property === 'x')?.setter).toHaveBeenCalledWith(120)
    expect(quickTargets.find(({ property }) => property === 'y')?.setter).toHaveBeenCalledWith(80)
    document.documentElement.dispatchEvent(new Event('pointerleave'))
    expect(cursor).not.toHaveClass('is-visible')
    cleanup()
    expect(quickTargets.every(({ setter }) => setter.tween?.kill)).toBe(true)
  })
})
