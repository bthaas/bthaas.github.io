import { describe, expect, it } from 'vitest'

import { getDocumentProgress, mapProgress } from './progress'

describe('atlas progress mapping', () => {
  it('maps document scroll to a bounded progress value', () => {
    const metrics = { scrollHeight: 3000, viewportHeight: 1000 }

    expect(getDocumentProgress({ ...metrics, scrollY: -20 })).toBe(0)
    expect(getDocumentProgress({ ...metrics, scrollY: 1000 })).toBe(0.5)
    expect(getDocumentProgress({ ...metrics, scrollY: 4000 })).toBe(1)
  })

  it('returns zero when the document has no scrollable range', () => {
    expect(getDocumentProgress({ scrollY: 0, scrollHeight: 800, viewportHeight: 800 })).toBe(0)
  })

  it('maps a local activation window with clamped endpoints', () => {
    expect(mapProgress(0.2, 0.2, 0.6)).toBe(0)
    expect(mapProgress(0.4, 0.2, 0.6)).toBe(0.5)
    expect(mapProgress(0.8, 0.2, 0.6)).toBe(1)
    expect(() => mapProgress(0.4, 0.6, 0.2)).toThrow(RangeError)
  })
})
