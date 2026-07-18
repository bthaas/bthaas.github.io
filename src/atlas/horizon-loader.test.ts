import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AtlasEngine } from './engine'
import { setupHorizonLoader } from './horizon-loader'

describe('contact horizon loader', () => {
  beforeEach(() => {
    document.documentElement.className = 'atlas-js'
    document.body.innerHTML = `
      <section id="contact" data-contact-finale>
        <div data-horizon-flock aria-hidden="true"></div>
      </section>
    `
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads one versioned horizon bundle only when contact approaches', () => {
    const triggers: Array<{ kill: ReturnType<typeof vi.fn>; vars: Record<string, unknown> }> = []
    const engine = {
      isCoarsePointer: false,
      ScrollTrigger: {
        create: vi.fn((vars: Record<string, unknown>) => {
          const trigger = { kill: vi.fn(), vars }
          triggers.push(trigger)
          return trigger
        }),
      },
    } as unknown as AtlasEngine
    const cleanup = setupHorizonLoader(document, engine, '/horizon.js?v=abc123')

    expect(triggers[0].vars).toMatchObject({
      once: true,
      start: 'top bottom+=50%',
      trigger: document.getElementById('contact'),
    })
    expect(document.querySelector('script[data-atlas-horizon]')).toBeNull()

    ;(triggers[0].vars.onEnter as () => void)()
    ;(triggers[0].vars.onEnter as () => void)()
    const script = document.querySelector<HTMLScriptElement>('script[data-atlas-horizon]')
    expect(document.querySelectorAll('script[data-atlas-horizon]')).toHaveLength(1)
    expect(script?.getAttribute('src')).toBe('/horizon.js?v=abc123')
    expect(script?.async).toBe(true)

    cleanup()
    expect(triggers[0].kill).toHaveBeenCalledOnce()
    expect(document.querySelector('script[data-atlas-horizon]')).toBeNull()
  })

  it('keeps coarse pointers native without preparing the heavy flourish', () => {
    const create = vi.fn()
    const engine = {
      isCoarsePointer: true,
      ScrollTrigger: { create },
    } as unknown as AtlasEngine

    setupHorizonLoader(document, engine, '/horizon.js?v=abc123')()

    expect(create).not.toHaveBeenCalled()
    expect(document.querySelector('script[data-atlas-horizon]')).toBeNull()
  })

  it('never prepares the horizon bundle at the mobile layout breakpoint', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390)
    const create = vi.fn()
    const engine = {
      isCoarsePointer: false,
      ScrollTrigger: { create },
    } as unknown as AtlasEngine

    setupHorizonLoader(document, engine, '/horizon.js?v=abc123')()

    expect(create).not.toHaveBeenCalled()
    expect(document.querySelector('script[data-atlas-horizon]')).toBeNull()
  })
})
