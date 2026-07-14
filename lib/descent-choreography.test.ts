import { describe, expect, it } from 'vitest'

import {
  getCloudTransition,
  getDescentLighting,
  getLandingProgress,
} from './descent-choreography'

describe('descent choreography', () => {
  it('peaks at a complete ivory whiteout before revealing the next scene', () => {
    expect(getCloudTransition(0)).toEqual({ whiteout: 0, outgoing: 1, incoming: 0 })
    expect(getCloudTransition(0.5)).toEqual({ whiteout: 1, outgoing: 0, incoming: 0 })
    expect(getCloudTransition(1)).toEqual({ whiteout: 0, outgoing: 0, incoming: 1 })
  })

  it('maps each stair landing to a bounded, overlapping activation window', () => {
    expect(getLandingProgress(0, 0)).toBe(0)
    expect(getLandingProgress(0.18, 0)).toBeGreaterThan(0)
    expect(getLandingProgress(0.3, 0)).toBe(1)
    expect(getLandingProgress(0.3, 1)).toBeGreaterThan(0)
    expect(getLandingProgress(0.3, 2)).toBe(0)
    expect(getLandingProgress(1, 3)).toBe(1)
  })

  it('cools and darkens the atmosphere as the descent progresses', () => {
    expect(getDescentLighting(0)).toEqual({ warmth: 1, exposure: 0.82, fogNear: 8 })
    expect(getDescentLighting(1)).toEqual({ warmth: 0.18, exposure: 0.64, fogNear: 5.5 })
  })
})
