import { describe, expect, it } from 'vitest'

import {
  getSectionApexProgress,
  getSunArcPosition,
  SUN_ARC_END_X,
  SUN_ARC_HEIGHT,
} from './sun-arc'

describe('header sun arc', () => {
  it('moves monotonically from the start to the horizon tick', () => {
    const positions = [0, 0.2, 0.4, 0.6, 0.8, 0.98, 1]
      .map((progress) => getSunArcPosition(progress, 0.4))

    expect(positions.map(({ x }) => x)).toEqual([...positions.map(({ x }) => x)].sort((a, b) => a - b))
    expect(positions[0]).toMatchObject({ landed: false, x: 0, y: 0 })
    expect(positions.at(-1)).toMatchObject({ landed: true, x: SUN_ARC_END_X, y: 0 })
  })

  it('reaches its apex in the measured Trajectory band', () => {
    expect(getSunArcPosition(0.4, 0.4)).toMatchObject({
      x: SUN_ARC_END_X / 2,
      y: -SUN_ARC_HEIGHT,
    })
    expect(getSunArcPosition(0.3, 0.4).y).toBeGreaterThan(-SUN_ARC_HEIGHT)
    expect(getSunArcPosition(0.5, 0.4).y).toBeGreaterThan(-SUN_ARC_HEIGHT)
  })

  it('lands exactly at the horizon from 98% onward', () => {
    expect(getSunArcPosition(0.979, 0.4).landed).toBe(false)
    expect(getSunArcPosition(0.98, 0.4)).toMatchObject({ landed: true, x: SUN_ARC_END_X, y: 0 })
    expect(getSunArcPosition(1, 0.4)).toMatchObject({ landed: true, x: SUN_ARC_END_X, y: 0 })
  })

  it('maps a section center to bounded document progress', () => {
    expect(getSectionApexProgress({
      scrollHeight: 6000,
      sectionHeight: 1200,
      sectionTop: 1800,
      viewportHeight: 1000,
    })).toBe(0.38)
    expect(getSectionApexProgress({
      scrollHeight: 1000,
      sectionHeight: 500,
      sectionTop: 0,
      viewportHeight: 1000,
    })).toBe(0)
  })
})
