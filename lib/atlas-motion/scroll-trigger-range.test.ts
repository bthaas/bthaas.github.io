import { describe, expect, it } from 'vitest'

import { getElementTraversalRange, getViewportEntryRange } from './scroll-trigger-range'

describe('ScrollTrigger ranges', () => {
  it('maps an element top between two viewport guide lines', () => {
    expect(getViewportEntryRange({
      elementTop: 3977,
      endViewportRatio: 0.22,
      startViewportRatio: 0.92,
      viewportHeight: 844,
    })).toEqual({ end: 3791.32, start: 3200.52 })
  })

  it('maps a full viewport traversal from entry through exit', () => {
    expect(getElementTraversalRange({
      elementHeight: 1340,
      elementTop: 3977,
      viewportHeight: 844,
    })).toEqual({ end: 5317, start: 3133 })
  })

  it('keeps degenerate ranges ordered and non-negative', () => {
    expect(getViewportEntryRange({
      elementTop: 20,
      endViewportRatio: 0.5,
      startViewportRatio: 0.5,
      viewportHeight: 100,
    })).toEqual({ end: 1, start: 0 })
  })
})
