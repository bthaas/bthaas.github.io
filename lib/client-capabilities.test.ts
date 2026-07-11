import { describe, expect, it } from 'vitest'

import { shouldRenderWebGL } from './client-capabilities'

describe('shouldRenderWebGL', () => {
  it('enables WebGL only for desktop motion-capable clients', () => {
    expect(shouldRenderWebGL({ width: 1280, reducedMotion: false, webGLAvailable: true })).toBe(
      true,
    )
    expect(shouldRenderWebGL({ width: 767, reducedMotion: false, webGLAvailable: true })).toBe(
      false,
    )
    expect(shouldRenderWebGL({ width: 1280, reducedMotion: true, webGLAvailable: true })).toBe(
      false,
    )
    expect(shouldRenderWebGL({ width: 1280, reducedMotion: false, webGLAvailable: false })).toBe(
      false,
    )
  })
})
