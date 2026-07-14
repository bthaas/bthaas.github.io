import { describe, expect, it } from 'vitest'

import { createWingLayout } from './wing-layout'

describe('createWingLayout', () => {
  it('creates a performance-bounded pair of asymmetric wings', () => {
    const feathers = createWingLayout(72)

    expect(feathers).toHaveLength(144)
    expect(feathers.filter(({ side }) => side === 'left')).toHaveLength(72)
    expect(feathers.filter(({ side }) => side === 'right')).toHaveLength(72)
    expect(feathers.filter(({ detached }) => detached).length).toBeGreaterThan(6)
    expect(feathers.filter(({ hidden }) => hidden).length).toBeGreaterThan(3)
  })

  it('is deterministic for stable server and client rendering', () => {
    expect(createWingLayout(12)).toEqual(createWingLayout(12))
  })
})
