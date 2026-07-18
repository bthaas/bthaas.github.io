import { describe, expect, it } from 'vitest'

import {
  createFeatherSeeds,
  createFeatherFrame,
  getPointerGustStrength,
  getVisibleFeatherCount,
  shouldUseConstrainedFeatherTier,
  writeFeatherFrame,
} from './feather-fall'

describe('feather-fall choreography', () => {
  it('builds from a sparse hero to the flight-log fall, then settles at contact', () => {
    const frame = createFeatherFrame()

    writeFeatherFrame(0.04, 0, frame)
    expect(frame.density).toBeLessThan(0.2)
    expect(frame.settle).toBe(0)

    writeFeatherFrame(0.36, 0, frame)
    expect(frame.density).toBeCloseTo(1)
    expect(frame.fallSpeed).toBeGreaterThan(0.9)
    expect(frame.tumble).toBeGreaterThan(0.9)

    writeFeatherFrame(0.66, 0, frame)
    expect(frame.density).toBeGreaterThan(0.3)
    expect(frame.density).toBeLessThan(0.6)

    writeFeatherFrame(0.94, 0, frame)
    expect(frame.density).toBeLessThan(0.15)
    expect(frame.settle).toBeGreaterThan(0.85)
    expect(frame.opacity).toBeLessThan(0.35)

    writeFeatherFrame(1, 0, frame)
    expect(frame.density).toBe(0)
    expect(frame.opacity).toBe(0)
  })

  it('converts signed scroll velocity into bounded wind, streak, and scatter', () => {
    const resting = createFeatherFrame()
    const fastDown = createFeatherFrame()
    const fastUp = createFeatherFrame()

    writeFeatherFrame(0.36, 0, resting)
    writeFeatherFrame(0.36, 180, fastDown)
    writeFeatherFrame(0.36, -180, fastUp)

    expect(resting.wind).toBe(0)
    expect(fastDown.wind).toBe(1)
    expect(fastUp.wind).toBe(-1)
    expect(fastDown.streak).toBe(1)
    expect(fastDown.scatter).toBeGreaterThan(resting.scatter)
  })

  it('creates stable tiered instance records with two depth layers', () => {
    const desktop = createFeatherSeeds(120, 1217)
    const repeated = createFeatherSeeds(120, 1217)
    const mobile = createFeatherSeeds(40, 1217)

    expect(desktop).toEqual(repeated)
    expect(desktop).toHaveLength(120)
    expect(mobile).toHaveLength(40)
    expect(new Set(desktop.map((seed) => seed.variant))).toEqual(new Set([0, 1, 2]))
    const nearCount = desktop.filter((seed) => seed.layer === 0).length
    expect(nearCount).toBeGreaterThanOrEqual(45)
    expect(nearCount).toBeLessThanOrEqual(55)
    expect(desktop.every((seed) => seed.readability >= 0.34 && seed.readability <= 1)).toBe(true)
  })

  it('uses the 40-feather performance tier for software renderers and Firefox', () => {
    expect(shouldUseConstrainedFeatherTier(true, 'Chrome/126.0')).toBe(true)
    expect(shouldUseConstrainedFeatherTier(false, 'Firefox/128.0')).toBe(true)
    expect(shouldUseConstrainedFeatherTier(false, 'Version/18.0 Safari/605.1.15')).toBe(false)
  })

  it('reveals only the narrative subset and bounds radial pointer gusts', () => {
    expect(getVisibleFeatherCount(120, 0.1)).toBe(12)
    expect(getVisibleFeatherCount(40, 1)).toBe(40)
    expect(getVisibleFeatherCount(40, 0)).toBe(0)
    expect(getPointerGustStrength(400, 0.1, 1)).toBe(0)
    expect(getPointerGustStrength(900, 0, 1)).toBeGreaterThan(0.5)
    expect(getPointerGustStrength(900, 1.1, 1)).toBe(0)
    expect(getPointerGustStrength(5000, 0, 1)).toBe(1)
  })
})
