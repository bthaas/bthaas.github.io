import { describe, expect, it } from 'vitest'

import { formatCountUpFrame, getSequenceProgress, parseCountUpTarget } from './count-up'

describe('count-up sequencing', () => {
  it.each([
    ['616K+', { decimals: 0, prefix: '', suffix: 'K+', value: 616 }],
    ['28.9%', { decimals: 1, prefix: '', suffix: '%', value: 28.9 }],
    ['$1,250.50', { decimals: 2, prefix: '$', suffix: '', value: 1250.5 }],
  ])('parses the metric target %s', (target, expected) => {
    expect(parseCountUpTarget(target)).toEqual(expected)
  })

  it('formats a stepped intermediate frame with the original affixes', () => {
    expect(formatCountUpFrame('28.9%', 0.5, 10)).toBe('14.5%')
    expect(formatCountUpFrame('616K+', 1, 10)).toBe('616K+')
  })

  it('stages sibling animations across a bounded sequence window', () => {
    expect(getSequenceProgress(0.2, 0, 4)).toBeGreaterThan(0)
    expect(getSequenceProgress(0.2, 3, 4)).toBe(0)
    expect(getSequenceProgress(1, 3, 4)).toBe(1)
  })

  it('rejects values without a numeric target', () => {
    expect(() => parseCountUpTarget('unknown')).toThrow(TypeError)
  })
})
