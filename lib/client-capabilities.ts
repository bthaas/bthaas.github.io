export interface ClientCapabilities {
  readonly reducedMotion: boolean
  readonly webGLAvailable: boolean
  readonly width: number
}

export interface WebGLProfile {
  readonly available: boolean
  readonly constrained: boolean
}

export function shouldRenderWebGL({
  reducedMotion,
  webGLAvailable,
  width,
}: ClientCapabilities): boolean {
  return width >= 320 && !reducedMotion && webGLAvailable
}

export function detectWebGLProfile(): WebGLProfile {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!context) return { available: false, constrained: false }
    const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo
      ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      : ''
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return {
      available: true,
      constrained: /swiftshader|llvmpipe|software/i.test(renderer),
    }
  } catch {
    return { available: false, constrained: false }
  }
}

export function detectWebGL(): boolean {
  return detectWebGLProfile().available
}
