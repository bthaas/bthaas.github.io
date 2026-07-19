import { describe, expect, it } from 'vitest'

import {
  getHeroLiquidFrame,
  getMastheadScatter,
  getTextureCoverScale,
} from './hero-overdrive'

describe('hero overdrive choreography', () => {
  it('preserves cover cropping for the accepted desktop and mobile hero boxes', () => {
    expect(getTextureCoverScale(1600 / 1130, 16 / 8.7)).toEqual({ x: 1, y: 0.77 })
    expect(getTextureCoverScale(1600 / 1130, 4 / 4.5)).toEqual({ x: 0.628, y: 1 })
    const reusable = { x: 0, y: 0 }
    expect(getTextureCoverScale(1600 / 1130, 16 / 8.7, reusable)).toBe(reusable)
    expect(reusable).toEqual({ x: 1, y: 0.77 })
  })

  it('bounds liquid displacement and returns to a glass-flat idle', () => {
    expect(getHeroLiquidFrame(0)).toEqual({ bulge: 0, uvShift: 0 })
    expect(getHeroLiquidFrame(60)).toEqual({ bulge: 0.003, uvShift: 0.003 })
    expect(getHeroLiquidFrame(10_000)).toEqual({ bulge: 0.006, uvShift: 0.006 })
    expect(getHeroLiquidFrame(-10_000)).toEqual({ bulge: -0.006, uvShift: -0.006 })
    const reusable = { bulge: 0, uvShift: 0 }
    expect(getHeroLiquidFrame(60, reusable)).toBe(reusable)
    expect(reusable).toEqual({ bulge: 0.003, uvShift: 0.003 })
  })

  it('scatters outer masthead characters farther with bounded feather-like rotation', () => {
    const frames = Array.from({ length: 9 }, (_, index) => getMastheadScatter(index, 9))

    expect(frames).toEqual(Array.from({ length: 9 }, (_, index) => getMastheadScatter(index, 9)))
    expect(Math.abs(frames[0].x)).toBeGreaterThan(Math.abs(frames[4].x))
    expect(Math.abs(frames[8].x)).toBeGreaterThan(Math.abs(frames[4].x))
    expect(frames.every(({ rotation }) => Math.abs(rotation) <= 18)).toBe(true)
    expect(new Set(frames.map(({ y }) => Math.sign(y))).size).toBe(2)
  })
})
