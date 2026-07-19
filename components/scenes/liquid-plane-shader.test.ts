import { describe, expect, it } from 'vitest'

import { liquidPlaneFragmentShader } from './liquid-plane-shader'

describe('liquid plane image fidelity', () => {
  it('applies the DOM focal crop and restores sRGB output for custom shaders', () => {
    expect(liquidPlaneFragmentShader).toContain('uniform vec2 uCoverOffset;')
    expect(liquidPlaneFragmentShader).toContain('uv += uCoverOffset;')
    expect(liquidPlaneFragmentShader).toContain('#include <colorspace_fragment>')
  })
})
