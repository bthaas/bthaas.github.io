import { Texture } from 'three'
import { describe, expect, it } from 'vitest'

import {
  configureProjectSpiralTexture,
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
