import { describe, expect, it } from 'vitest'

import { clampProgress, smoothstep, steppedProgress } from './curves'

describe('atlas motion curves', () => {
  it('clamps progress to the inclusive unit interval', () => {
    expect(clampProgress(-0.4)).toBe(0)
    expect(clampProgress(0.35)).toBe(0.35)
    expect(clampProgress(1.8)).toBe(1)
  })

  it('eases smoothly while preserving exact endpoints', () => {
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(0.5)).toBe(0.5)
    expect(smoothstep(1)).toBe(1)
  })

  it('quantizes progress without exceeding the source value', () => {
    expect(steppedProgress(0.49, 10)).toBe(0.4)
    expect(steppedProgress(1, 10)).toBe(1)
    expect(() => steppedProgress(0.5, 0)).toThrow(RangeError)
  })
})
