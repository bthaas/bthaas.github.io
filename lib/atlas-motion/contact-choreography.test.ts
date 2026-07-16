import { describe, expect, it } from 'vitest'

import {
  getContactCharacterOffsetEm,
  getContactDetailRevealProgress,
  getContactDocumentProgress,
  getContactGlowProgress,
  getContactImageOffsetPercent,
  getContactPlateRevealProgress,
  getContactScrollProgress,
  getContactWordRevealProgress,
} from './contact-choreography'

describe('contact choreography', () => {
  it('maps the finale from first viewport entry through the document ending', () => {
    const metrics = {
      elementHeight: 1200,
      elementTop: 5000,
      viewportHeight: 1000,
    }

    expect(getContactScrollProgress({ ...metrics, scrollY: 4000 })).toBe(0)
    expect(getContactScrollProgress({ ...metrics, scrollY: 4600 })).toBe(0.5)
    expect(getContactScrollProgress({ ...metrics, scrollY: 5200 })).toBe(1)
    expect(getContactDocumentProgress(0.88)).toBe(0)
    expect(getContactDocumentProgress(0.94)).toBe(0.5)
    expect(getContactDocumentProgress(1)).toBe(1)
  })

  it('spreads characters from the center by at most 0.02em per adjacent gap', () => {
    const offsets = Array.from({ length: 5 }, (_, index) => (
      getContactCharacterOffsetEm(index, 5, 1)
    ))

    expect(offsets).toEqual([-0.04, -0.02, 0, 0.02, 0.04])
    expect(offsets.slice(1).map((offset, index) => offset - offsets[index])).toEqual([
      0.02,
      0.02,
      0.02,
      0.02,
    ])
    expect(getContactCharacterOffsetEm(0, 5, 0)).toBe(0)
  })

  it('reveals whole words in a short stagger near section entry', () => {
    expect(getContactWordRevealProgress(0, 0)).toBe(0)
    expect(getContactWordRevealProgress(0.25, 0)).toBe(1)
    expect(getContactWordRevealProgress(0.25, 1)).toBeGreaterThan(0)
    expect(getContactWordRevealProgress(0.4, 1)).toBe(1)
  })

  it('settles the horizon plate during the opening third of the finale', () => {
    expect(getContactPlateRevealProgress(0)).toBe(0)
    expect(getContactPlateRevealProgress(0.17)).toBe(0.5)
    expect(getContactPlateRevealProgress(0.34)).toBe(1)
    expect(getContactPlateRevealProgress(1)).toBe(1)
  })

  it('pans the horizon image gently across the complete contact scroll', () => {
    expect(getContactImageOffsetPercent(0)).toBe(2.5)
    expect(getContactImageOffsetPercent(0.5)).toBe(0)
    expect(getContactImageOffsetPercent(1)).toBe(-2.5)
  })

  it('reveals contact details in reading order after the headline', () => {
    expect(getContactDetailRevealProgress(0.1, 0)).toBe(0.5)
    expect(getContactDetailRevealProgress(0.2, 0)).toBe(1)
    expect(getContactDetailRevealProgress(0.2, 1)).toBe(0)
    expect(getContactDetailRevealProgress(0.53, 1)).toBe(1)
    expect(getContactDetailRevealProgress(0.53, 2)).toBe(0.5)
    expect(getContactDetailRevealProgress(0.93, 5)).toBe(1)
    expect(() => getContactDetailRevealProgress(0.5, -1)).toThrow(RangeError)
    expect(() => getContactDetailRevealProgress(0.5, 6)).toThrow(RangeError)
  })

  it('completes the glow only when both the finale and sun handshake complete', () => {
    expect(getContactGlowProgress(0, 0.98)).toBe(0)
    expect(getContactGlowProgress(1, 0.8)).toBe(0)
    expect(getContactGlowProgress(1, 0.98)).toBe(1)
    expect(getContactGlowProgress(0.5, 0.98)).toBe(0.5)
  })
})
