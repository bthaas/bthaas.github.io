import { describe, expect, it } from 'vitest'

import {
  getMagneticOffset,
  getMarqueeVelocityFrame,
  getPlateVelocityFrame,
} from './kinetics'

describe('signature-motion kinetics', () => {
  it('keeps velocity plate deformation restrained and directional', () => {
    expect(getPlateVelocityFrame(0)).toEqual({ scale: 1, skewY: 0 })
    expect(getPlateVelocityFrame(1_200)).toEqual({ scale: 1.004, skewY: 0.6 })
    expect(getPlateVelocityFrame(-9_000)).toEqual({ scale: 1.012, skewY: -1.5 })
  })

  it('accelerates and leans the marquee without reversing it', () => {
    expect(getMarqueeVelocityFrame(0)).toEqual({ skewX: 0, timeScale: 1 })
    expect(getMarqueeVelocityFrame(1_500)).toEqual({ skewX: 1, timeScale: 1.75 })
    expect(getMarqueeVelocityFrame(-9_000)).toEqual({ skewX: -2, timeScale: 2.2 })
  })

  it('maps pointer distance into a six-pixel magnetic envelope', () => {
    expect(getMagneticOffset({ centerX: 50, centerY: 50, pointerX: 50, pointerY: 50 }))
      .toEqual({ x: 0, y: 0 })
    expect(getMagneticOffset({ centerX: 50, centerY: 50, pointerX: 500, pointerY: -500 }))
      .toEqual({ x: 6, y: -6 })
  })
})
