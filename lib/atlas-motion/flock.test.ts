import { describe, expect, it } from 'vitest'

import { createFlock, getFlockFrameDelta, stepFlock } from './flock'

describe('contact flock choreography', () => {
  it('creates a deterministic sparse flock inside the horizon band', () => {
    const first = createFlock(24, 73)
    const second = createFlock(24, 73)

    expect(first).toEqual(second)
    expect(first).toHaveLength(24)
    expect(first.every(({ x, y }) => x >= 0 && x <= 1 && y >= 0.12 && y <= 0.68))
      .toBe(true)
  })

  it('advances flocking forces while keeping speed and altitude restrained', () => {
    const flock = createFlock(24, 73)
    const next = stepFlock(flock, 1 / 30)

    expect(next).not.toEqual(flock)
    next.forEach((bird) => {
      expect(Math.hypot(bird.vx, bird.vy)).toBeLessThanOrEqual(0.09)
      expect(bird.y).toBeGreaterThanOrEqual(0.08)
      expect(bird.y).toBeLessThanOrEqual(0.72)
    })
  })

  it('wraps birds cleanly across the plate and clamps long frame gaps', () => {
    const [bird] = createFlock(1, 9)
    const wrapped = stepFlock([{ ...bird, vx: 0.09, x: 1.049 }], 1)

    expect(wrapped[0].x).toBeLessThan(0)
    expect(wrapped[0].phase - bird.phase).toBeLessThanOrEqual(0.09)
  })

  it('caps canvas work at 60 Hz and clamps long frame gaps', () => {
    expect(getFlockFrameDelta(0, 8)).toBeNull()
    expect(getFlockFrameDelta(0, 17)).toBeCloseTo(0.017)
    expect(getFlockFrameDelta(0, 1_000)).toBe(0.05)
  })
})
