import { describe, expect, it } from 'vitest'

import {
  getMagneticOffset,
  getPlateVelocityFrame,
} from './kinetics'

describe('signature-motion kinetics', () => {
  it('keeps velocity plate deformation restrained and directional', () => {
    expect(getPlateVelocityFrame(0)).toEqual({ scale: 1, skewY: 0 })
    expect(getPlateVelocityFrame(1_200)).toEqual({ scale: 1.004, skewY: 0.6 })
    expect(getPlateVelocityFrame(-9_000)).toEqual({ scale: 1.012, skewY: -1.5 })
  })

  it('maps pointer distance into a six-pixel magnetic envelope', () => {
    expect(getMagneticOffset({ centerX: 50, centerY: 50, pointerX: 50, pointerY: 50 }))
      .toEqual({ x: 0, y: 0 })
    expect(getMagneticOffset({ centerX: 50, centerY: 50, pointerX: 500, pointerY: -500 }))
      .toEqual({ x: 6, y: -6 })
  })
})
