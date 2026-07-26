import { describe, expect, it } from 'vitest'

import { getTextureCoverScale } from './texture-cover'

describe('texture cover sizing', () => {
  it('preserves cover cropping for wide and tall media boxes', () => {
    expect(getTextureCoverScale(1600 / 1130, 16 / 8.7)).toEqual({ x: 1, y: 0.77 })
    expect(getTextureCoverScale(1600 / 1130, 4 / 4.5)).toEqual({ x: 0.628, y: 1 })
    const reusable = { x: 0, y: 0 }
    expect(getTextureCoverScale(1600 / 1130, 16 / 8.7, reusable)).toBe(reusable)
    expect(reusable).toEqual({ x: 1, y: 0.77 })
  })
})
