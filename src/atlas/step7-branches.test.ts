import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getContactCharacterOffsetEm,
  getContactScrollProgress,
} from '../../lib/atlas-motion/contact-choreography'

import { setupContactFinale } from './contact'
import { setupCursor } from './cursor'
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
    const frames: FrameRequestCallback[] = []
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    const cancelFrame = vi.fn()
    const cleanup = setupCursor(document, () => true, requestFrame, cancelFrame)
    const plain = document.getElementById('plain')!
    const cursor = document.querySelector<HTMLElement>('[data-atlas-cursor]')!

    plain.dispatchEvent(new MouseEvent('pointermove', {
      bubbles: true,
      clientX: 120,
      clientY: 80,
    }))
    for (let index = 0; index < 60 && frames.length > 0; index += 1) {
      frames.shift()?.(index)
    }

    expect(cursor).toHaveClass('is-visible')
    expect(cursor).toHaveAttribute('data-cursor-mode', 'default')
    expect(
      Number.parseFloat(cursor.style.getPropertyValue('--atlas-cursor-ring-x')),
    ).toBeGreaterThan(119.8)
    document.documentElement.dispatchEvent(new Event('pointerleave'))
    expect(cursor).not.toHaveClass('is-visible')
    cleanup()
    expect(cancelFrame).toHaveBeenCalled()
  })
})
