import { describe, expect, it } from 'vitest'

import { createFramePacer } from './frame-pacing'

function countRenders(fps: number, refreshRate: number, seconds = 1): number {
  const pacer = createFramePacer(fps)
  const frameMs = 1000 / refreshRate
  let renders = 0
  for (let frame = 1; frame <= refreshRate * seconds; frame += 1) {
    if (pacer.shouldRender(frame * frameMs)) renders += 1
  }
  return renders
}

describe('createFramePacer', () => {
  it('halves a 120 Hz display down to 60 rendered frames per second', () => {
    expect(countRenders(60, 120)).toBe(60)
  })

  it('renders every frame on a 60 Hz display without dropping jittered vsyncs', () => {
    const pacer = createFramePacer(60)
    const jitteredVsyncs = [16.4, 33.5, 49.9, 66.6, 83.1, 100]

    expect(jitteredVsyncs.filter((time) => pacer.shouldRender(time))).toHaveLength(6)
  })

  it('caps a 30 fps tier on both 60 Hz and 120 Hz displays', () => {
    expect(countRenders(30, 60)).toBe(30)
    expect(countRenders(30, 120)).toBe(30)
  })

  it('averages the cap on refresh rates that are not a multiple of it', () => {
    for (const refreshRate of [75, 90, 100, 144, 165]) {
      expect(countRenders(60, refreshRate, 2) / 2).toBeGreaterThanOrEqual(59)
      expect(countRenders(60, refreshRate, 2) / 2).toBeLessThanOrEqual(61)
      expect(countRenders(30, refreshRate, 2) / 2).toBeGreaterThanOrEqual(29)
      expect(countRenders(30, refreshRate, 2) / 2).toBeLessThanOrEqual(31)
    }
  })

  it('renders the first frame immediately and recovers after a long pause', () => {
    const pacer = createFramePacer(60)

    expect(pacer.shouldRender(5_000)).toBe(true)
    expect(pacer.shouldRender(5_008)).toBe(false)
    expect(pacer.shouldRender(9_000)).toBe(true)
  })

  it('rejects non-positive frame rates', () => {
    expect(() => createFramePacer(0)).toThrow(RangeError)
    expect(() => createFramePacer(Number.NaN)).toThrow(RangeError)
  })
})
