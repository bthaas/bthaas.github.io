import { Texture } from 'three'
import { describe, expect, it } from 'vitest'

import {
  configureProjectSpiralTexture,
  isProjectSpiralInMotion,
  shouldAnimateProjectViewTransition,
} from './project-spiral-rendering'

describe('project spiral texture configuration', () => {
  it('uses glTF UV orientation so project images render upright', () => {
    const texture = new Texture()

    configureProjectSpiralTexture(texture, 12)

    expect(texture.flipY).toBe(false)
    expect(texture.anisotropy).toBe(8)
    expect(texture.colorSpace).toBe('srgb')
    expect(texture.version).toBeGreaterThan(0)
  })

  it('only morphs between distinct views when motion is allowed', () => {
    expect(shouldAnimateProjectViewTransition(false, 'spiral', 'index')).toBe(true)
    expect(shouldAnimateProjectViewTransition(false, 'index', 'index')).toBe(false)
    expect(shouldAnimateProjectViewTransition(true, 'index', 'spiral')).toBe(false)
  })
})

describe('project spiral motion detection', () => {
  const settled = { phaseGap: 0, rotationGapX: 0, rotationGapY: 0, velocity: 0 }

  it('treats the idle bob alone as settled so it can run at the capped rate', () => {
    expect(isProjectSpiralInMotion(settled)).toBe(false)
    expect(isProjectSpiralInMotion({ ...settled, phaseGap: 0.00005, velocity: -0.05 })).toBe(false)
  })

  it('reports motion while scroll phase, scroll velocity, or pointer tilt is still easing', () => {
    expect(isProjectSpiralInMotion({ ...settled, phaseGap: -0.01 })).toBe(true)
    expect(isProjectSpiralInMotion({ ...settled, velocity: 240 })).toBe(true)
    expect(isProjectSpiralInMotion({ ...settled, rotationGapX: 0.002 })).toBe(true)
    expect(isProjectSpiralInMotion({ ...settled, rotationGapY: -0.002 })).toBe(true)
  })
})
