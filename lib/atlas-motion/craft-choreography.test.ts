import { describe, expect, it } from 'vitest'

import { getCraftMotion, getCraftViewProgress } from './craft-choreography'

describe('craft chapter choreography', () => {
  it('maps the plate entering and covering the viewport to bounded progress', () => {
    const metrics = {
      elementHeight: 900,
      elementTop: 2000,
      viewportHeight: 1000,
    }

    expect(getCraftViewProgress({ ...metrics, scrollY: 900 })).toBe(0)
    expect(getCraftViewProgress({ ...metrics, scrollY: 1702.5 })).toBe(0.5)
    expect(getCraftViewProgress({ ...metrics, scrollY: 2500 })).toBe(1)
  })

  it('unclips the plate while moving its image and ghost numeral in opposite directions', () => {
    expect(getCraftMotion(0)).toEqual({
      clipBottomPercent: 100,
      ghostTranslatePixels: 28,
      imageTranslatePercent: -4,
    })
    expect(getCraftMotion(0.5)).toEqual({
      clipBottomPercent: 50,
      ghostTranslatePixels: 0,
      imageTranslatePercent: 0,
    })
    expect(getCraftMotion(1)).toEqual({
      clipBottomPercent: 0,
      ghostTranslatePixels: -28,
      imageTranslatePercent: 4,
    })
  })
})
