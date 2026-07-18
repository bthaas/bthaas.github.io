import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const lenisInstances: Array<{
    destroy: ReturnType<typeof vi.fn>
    off: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    options: Record<string, unknown>
    raf: ReturnType<typeof vi.fn>
    scrollHandler?: () => void
  }> = []

  return {
    drawSvgPlugin: { name: 'DrawSVGPlugin' },
    flip: { name: 'Flip' },
    lenisInstances,
    motionPathPlugin: { name: 'MotionPathPlugin' },
    registerPlugin: vi.fn(),
    scrambleTextPlugin: { name: 'ScrambleTextPlugin' },
    scrollTrigger: { update: vi.fn() },
    splitText: { name: 'SplitText' },
    ticker: {
      add: vi.fn(),
      lagSmoothing: vi.fn(),
      remove: vi.fn(),
    },
  }
})

vi.mock('lenis', () => ({
  default: class LenisMock {
    destroy = vi.fn()
    off = vi.fn()
    on = vi.fn((_event: string, handler: () => void) => {
      this.scrollHandler = handler
    })
    options: Record<string, unknown>
    raf = vi.fn()
    scrollHandler?: () => void

    constructor(options: Record<string, unknown>) {
      this.options = options
      mocks.lenisInstances.push(this)
    }
  },
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: mocks.registerPlugin,
    ticker: mocks.ticker,
  },
}))
vi.mock('gsap/DrawSVGPlugin', () => ({ DrawSVGPlugin: mocks.drawSvgPlugin }))
vi.mock('gsap/Flip', () => ({ Flip: mocks.flip }))
vi.mock('gsap/MotionPathPlugin', () => ({ MotionPathPlugin: mocks.motionPathPlugin }))
vi.mock('gsap/ScrambleTextPlugin', () => ({ ScrambleTextPlugin: mocks.scrambleTextPlugin }))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: mocks.scrollTrigger }))
vi.mock('gsap/SplitText', () => ({ SplitText: mocks.splitText }))

import { getAtlasEngine, initializeAtlasEngine } from './engine'

describe('Atlas motion engine', () => {
  afterEach(() => {
    getAtlasEngine()?.destroy()
    mocks.lenisInstances.length = 0
    vi.clearAllMocks()
  })

  it('does not register or initialize motion when reduced motion is requested', () => {
    const matchMedia = vi.fn(() => ({ matches: true }))

    expect(initializeAtlasEngine({ matchMedia })).toBeNull()
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(mocks.registerPlugin).not.toHaveBeenCalled()
    expect(mocks.lenisInstances).toHaveLength(0)
    expect(getAtlasEngine()).toBeNull()
  })

  it('registers the approved plugins and drives Lenis from the GSAP ticker', () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === '(pointer: coarse)' ? false : false,
    }))

    const engine = initializeAtlasEngine({ matchMedia })
    const lenis = mocks.lenisInstances[0]
    const ticker = mocks.ticker.add.mock.calls[0][0] as (time: number) => void

    expect(engine).not.toBeNull()
    expect(getAtlasEngine()).toBe(engine)
    expect(engine?.plugins.SplitText).toBe(mocks.splitText)
    expect(mocks.registerPlugin).toHaveBeenCalledWith(
      mocks.scrollTrigger,
      mocks.splitText,
      mocks.scrambleTextPlugin,
      mocks.drawSvgPlugin,
      mocks.motionPathPlugin,
      mocks.flip,
    )
    expect(lenis.options).toEqual({
      autoRaf: false,
      lerp: 0.14,
      smoothWheel: true,
      syncTouch: false,
    })
    expect(mocks.ticker.lagSmoothing).toHaveBeenCalledWith(0)

    ticker(1.25)
    expect(lenis.raf).toHaveBeenCalledWith(1250)
    lenis.scrollHandler?.()
    expect(mocks.scrollTrigger.update).toHaveBeenCalledOnce()

    engine?.destroy()
    engine?.destroy()
    expect(mocks.ticker.remove).toHaveBeenCalledOnce()
    expect(lenis.off).toHaveBeenCalledWith('scroll', mocks.scrollTrigger.update)
    expect(lenis.destroy).toHaveBeenCalledOnce()
    expect(getAtlasEngine()).toBeNull()
  })

  it('keeps coarse-pointer scrolling native while retaining ScrollTrigger', () => {
    const engine = initializeAtlasEngine({
      matchMedia: (query) => ({ matches: query === '(pointer: coarse)' }),
    })

    expect(engine?.isCoarsePointer).toBe(true)
    expect(mocks.lenisInstances[0].options).toMatchObject({
      smoothWheel: false,
      syncTouch: false,
    })
  })
})
