import { afterEach, describe, expect, it, vi } from 'vitest'

import { detectWebGL, detectWebGLProfile, shouldRenderWebGL } from './client-capabilities'

afterEach(() => vi.restoreAllMocks())

describe('client WebGL capabilities', () => {
  it('keeps WebGL available on supported desktop and mobile tiers only', () => {
    expect(shouldRenderWebGL({ reducedMotion: false, webGLAvailable: true, width: 1280 })).toBe(true)
    expect(shouldRenderWebGL({ reducedMotion: false, webGLAvailable: true, width: 390 })).toBe(true)
    expect(shouldRenderWebGL({ reducedMotion: false, webGLAvailable: true, width: 319 })).toBe(false)
    expect(shouldRenderWebGL({ reducedMotion: true, webGLAvailable: true, width: 1280 })).toBe(false)
    expect(shouldRenderWebGL({ reducedMotion: false, webGLAvailable: false, width: 1280 })).toBe(false)
  })

  it('uses WebGL2 first, falls back to WebGL1, and releases the probe context', () => {
    const loseContext = vi.fn()
    const getExtension = vi.fn((name: string) => (
      name === 'WEBGL_lose_context' ? { loseContext } : null
    ))
    const getContext = vi.fn((kind: string) => (
      kind === 'webgl' ? { getExtension, getParameter: vi.fn() } : null
    ))
    vi.spyOn(document, 'createElement').mockReturnValue({ getContext } as unknown as HTMLCanvasElement)

    expect(detectWebGL()).toBe(true)
    expect(getContext).toHaveBeenNthCalledWith(1, 'webgl2')
    expect(getContext).toHaveBeenNthCalledWith(2, 'webgl')
    expect(loseContext).toHaveBeenCalledOnce()
  })

  it('fails closed when canvas probing throws', () => {
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw new Error('canvas unavailable')
    })
    expect(detectWebGL()).toBe(false)
  })

  it('recognizes software renderers for a deliberate low-cost tier', () => {
    const loseContext = vi.fn()
    const debugInfo = { UNMASKED_RENDERER_WEBGL: 37_446 }
    const context = {
      getExtension: vi.fn((name: string) => (
        name === 'WEBGL_debug_renderer_info' ? debugInfo : { loseContext }
      )),
      getParameter: vi.fn(() => 'ANGLE (SwiftShader Device)'),
    }
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => context),
    } as unknown as HTMLCanvasElement)

    expect(detectWebGLProfile()).toEqual({ available: true, constrained: true })
    expect(loseContext).toHaveBeenCalledOnce()
  })
})
