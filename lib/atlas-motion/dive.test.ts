import { describe, expect, it } from 'vitest'

import {
  getCoverRect,
  getPreloadOrder,
  getSectionProgress,
  getWashAlpha,
  progressToFrame,
} from './dive'

describe('dive scroll choreography', () => {
  it('maps the sticky track travel to clamped section progress', () => {
    const track = { bottom: 4000, height: 4000, top: 0 }

    expect(getSectionProgress(track, 1000)).toBe(0)
    expect(getSectionProgress({ ...track, bottom: 2500, top: -1500 }, 1000)).toBe(0.5)
    expect(getSectionProgress({ ...track, bottom: 1000, top: -3000 }, 1000)).toBe(1)
    expect(getSectionProgress({ ...track, bottom: 4200, top: 200 }, 1000)).toBe(0)
    expect(getSectionProgress({ ...track, bottom: 0, top: -4000 }, 1000)).toBe(1)
  })

  it('returns zero when the track has no scrollable distance', () => {
    expect(getSectionProgress({ bottom: 1000, height: 1000, top: 0 }, 1000)).toBe(0)
  })

  it('maps bounded progress across every available frame', () => {
    expect(progressToFrame(-1, 144)).toBe(0)
    expect(progressToFrame(0, 144)).toBe(0)
    expect(progressToFrame(0.5, 144)).toBe(72)
    expect(progressToFrame(0.999, 144)).toBe(143)
    expect(progressToFrame(1, 144)).toBe(143)
    expect(progressToFrame(2, 144)).toBe(143)
    expect(progressToFrame(0.5, 0)).toBe(0)
  })

  it('calculates a centered source crop for cover-fit drawing', () => {
    expect(getCoverRect(1000, 1000, 1280, 688)).toEqual({
      dx: 0,
      dy: 0,
      dw: 1000,
      dh: 1000,
      sx: 296,
      sy: 0,
      sw: 688,
      sh: 688,
    })

    const wide = getCoverRect(1920, 800, 1280, 688)
    expect(wide.sx).toBe(0)
    expect(wide.sy).toBeCloseTo(77.333333)
    expect(wide.sw).toBe(1280)
    expect(wide.sh).toBeCloseTo(533.333333)
    expect(wide.dw).toBe(1920)
    expect(wide.dh).toBe(800)
  })

  it('returns an empty draw rectangle for invalid dimensions', () => {
    expect(getCoverRect(0, 1000, 1280, 688)).toEqual({
      dx: 0,
      dy: 0,
      dw: 0,
      dh: 0,
      sx: 0,
      sy: 0,
      sw: 0,
      sh: 0,
    })
  })

  it('ramps the abyss wash only over the end of the scrub', () => {
    expect(getWashAlpha(-1)).toBe(0)
    expect(getWashAlpha(0.87)).toBe(0)
    expect(getWashAlpha(0.88)).toBe(0)
    expect(getWashAlpha(0.94)).toBeCloseTo(0.5)
    expect(getWashAlpha(1)).toBe(1)
    expect(getWashAlpha(2)).toBe(1)
  })

  it('loads coarse frames first before filling every gap exactly once', () => {
    expect(getPreloadOrder(10, 4)).toEqual([0, 4, 8, 1, 2, 3, 5, 6, 7, 9])

    const completeOrder = getPreloadOrder(144)
    expect(completeOrder).toHaveLength(144)
    expect(new Set(completeOrder).size).toBe(144)
    expect(completeOrder.slice(0, 4)).toEqual([0, 8, 16, 24])
    expect(getPreloadOrder(0)).toEqual([])
    expect(() => getPreloadOrder(10, 0)).toThrow(RangeError)
  })
})
