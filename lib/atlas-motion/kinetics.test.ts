import { describe, expect, it } from 'vitest'

import { getMagneticOffset } from './kinetics'

describe('signature-motion kinetics', () => {
  it('maps pointer distance into a six-pixel magnetic envelope', () => {
    expect(getMagneticOffset({ centerX: 50, centerY: 50, pointerX: 50, pointerY: 50 }))
      .toEqual({ x: 0, y: 0 })
    expect(getMagneticOffset({ centerX: 50, centerY: 50, pointerX: 500, pointerY: -500 }))
      .toEqual({ x: 6, y: -6 })
  })
})
