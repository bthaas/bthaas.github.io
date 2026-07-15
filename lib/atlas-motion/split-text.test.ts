import { describe, expect, it } from 'vitest'

import { planSplitText } from './split-text'

describe('split-text planning', () => {
  it('plans accessible character segments without losing whitespace', () => {
    const plan = planSplitText('Brett Haas', 'character')

    expect(plan.accessibleLabel).toBe('Brett Haas')
    expect(plan.segments.map(({ value }) => value).join('')).toBe('Brett Haas')
    expect(plan.segments.filter(({ isWhitespace }) => !isWhitespace)).toHaveLength(9)
  })

  it('plans word segments while retaining the original spacing', () => {
    const plan = planSplitText('Keep  building.', 'word')

    expect(plan.segments).toEqual([
      { index: 0, isWhitespace: false, value: 'Keep' },
      { index: -1, isWhitespace: true, value: '  ' },
      { index: 1, isWhitespace: false, value: 'building.' },
    ])
  })

  it('returns an empty plan for empty text', () => {
    expect(planSplitText('', 'word')).toEqual({ accessibleLabel: '', segments: [] })
  })
})
