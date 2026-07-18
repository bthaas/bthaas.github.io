import { describe, expect, it } from 'vitest'

import {
  getHeroLiquidFrame,
  getKineticBandFrame,
  getMastheadScatter,
  getTextureCoverScale,
} from './hero-overdrive'

describe('hero overdrive choreography', () => {
  it('preserves cover cropping for the accepted desktop and mobile hero boxes', () => {
    expect(getTextureCoverScale(1600 / 1130, 16 / 8.7)).toEqual({ x: 1, y: 0.77 })
    expect(getTextureCoverScale(1600 / 1130, 4 / 4.5)).toEqual({ x: 0.628, y: 1 })
  })

  it('bounds liquid displacement and returns to a glass-flat idle', () => {
    expect(getHeroLiquidFrame(0)).toEqual({ bulge: 0, uvShift: 0 })
    expect(getHeroLiquidFrame(60)).toEqual({ bulge: 0.003, uvShift: 0.003 })
    expect(getHeroLiquidFrame(10_000)).toEqual({ bulge: 0.006, uvShift: 0.006 })
    expect(getHeroLiquidFrame(-10_000)).toEqual({ bulge: -0.006, uvShift: -0.006 })
  })

  it('scatters outer masthead characters farther with bounded feather-like rotation', () => {
    const frames = Array.from({ length: 9 }, (_, index) => getMastheadScatter(index, 9))

    expect(frames).toEqual(Array.from({ length: 9 }, (_, index) => getMastheadScatter(index, 9)))
    expect(Math.abs(frames[0].x)).toBeGreaterThan(Math.abs(frames[4].x))
    expect(Math.abs(frames[8].x)).toBeGreaterThan(Math.abs(frames[4].x))
    expect(frames.every(({ rotation }) => Math.abs(rotation) <= 18)).toBe(true)
    expect(new Set(frames.map(({ y }) => Math.sign(y))).size).toBe(2)
  })

  it('maps Lenis velocity to alternating bounded band speed and skew', () => {
    expect(getKineticBandFrame(0, 1)).toEqual({ direction: 1, skew: 0, timeScale: 1 })
    expect(getKineticBandFrame(120, 1)).toEqual({ direction: 1, skew: 8, timeScale: 3.4 })
    expect(getKineticBandFrame(-120, 1)).toEqual({ direction: -1, skew: -8, timeScale: 3.4 })
    expect(getKineticBandFrame(120, -1).direction).toBe(-1)
  })
})
