import { describe, expect, it } from 'vitest'

import {
  getEntranceTimeline,
  getHeroExitProgress,
  getHeroParallax,
  getMetricCountProgress,
} from './hero-choreography'

describe('hero choreography', () => {
  it('keeps the nine-character masthead entrance within 1.2 seconds', () => {
    const timeline = getEntranceTimeline(9)

    expect(timeline.plate).toEqual({ durationMs: 700, startMs: 0 })
    expect(timeline.characterStartMs).toEqual([360, 420, 480, 540, 600, 660, 720, 780, 840])
    expect(timeline.characterDurationMs).toBe(360)
    expect(timeline.chrome).toEqual({ durationMs: 240, startMs: 900 })
    expect(timeline.totalMs).toBe(1200)
  })

  it('maps the first hero exit to overscan, caption drift, and settle', () => {
    expect(getHeroParallax(0)).toEqual({
      captionTranslateVh: 0,
      imageTranslatePercent: 0,
      plateScale: 1.05,
    })
    expect(getHeroParallax(0.5)).toEqual({
      captionTranslateVh: -1.25,
      imageTranslatePercent: 5.35,
      plateScale: 1.025,
    })
    expect(getHeroParallax(1)).toEqual({
      captionTranslateVh: -2.5,
      imageTranslatePercent: 10.7,
      plateScale: 1,
    })
  })

  it('measures progress only while the hero plate exits the viewport', () => {
    expect(getHeroExitProgress({ elementHeight: 700, elementTop: 100, scrollY: 50 })).toBe(0)
    expect(getHeroExitProgress({ elementHeight: 700, elementTop: 100, scrollY: 450 })).toBe(0.5)
    expect(getHeroExitProgress({ elementHeight: 700, elementTop: 100, scrollY: 900 })).toBe(1)
  })

  it('uses a bounded stepped easing curve for metric frames', () => {
    expect(getMetricCountProgress(-1)).toBe(0)
    expect(getMetricCountProgress(0.5, 10)).toBe(0.5)
    expect(getMetricCountProgress(0.76, 10)).toBe(0.8)
    expect(getMetricCountProgress(2)).toBe(1)
  })
})
