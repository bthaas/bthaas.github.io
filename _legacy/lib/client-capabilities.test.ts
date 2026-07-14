import { afterEach, describe, expect, it, vi } from 'vitest'

import { detectWebGL, shouldRenderWebGL } from './client-capabilities'

afterEach(() => vi.restoreAllMocks())

describe('shouldRenderWebGL', () => {
  it('enables WebGL for desktop and mobile motion-capable clients', () => {
    expect(shouldRenderWebGL({ width: 1280, reducedMotion: false, webGLAvailable: true })).toBe(
      true,
    )
    expect(shouldRenderWebGL({ width: 390, reducedMotion: false, webGLAvailable: true })).toBe(
      true,
    )
    expect(shouldRenderWebGL({ width: 319, reducedMotion: false, webGLAvailable: true })).toBe(false)
    expect(shouldRenderWebGL({ width: 1280, reducedMotion: true, webGLAvailable: true })).toBe(
      false,
    )
    expect(shouldRenderWebGL({ width: 1280, reducedMotion: false, webGLAvailable: false })).toBe(
      false,
    )
  })

  it('detects WebGL2 and falls back to WebGL1', () => {
    const getContext = vi.fn((kind: string) => (kind === 'webgl' ? {} : null))
    vi.spyOn(document, 'createElement').mockReturnValue({ getContext } as unknown as HTMLCanvasElement)

    expect(detectWebGL()).toBe(true)
    expect(getContext).toHaveBeenNthCalledWith(1, 'webgl2')
    expect(getContext).toHaveBeenNthCalledWith(2, 'webgl')
  })

  it('returns false when canvas creation is unavailable', () => {
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw new Error('canvas unavailable')
    })

    expect(detectWebGL()).toBe(false)
  })
})
