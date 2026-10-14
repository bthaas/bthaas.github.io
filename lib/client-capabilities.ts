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

const UNAVAILABLE_PROFILE: WebGLProfile = { available: false, constrained: false }

// Each probe creates and destroys a throwaway WebGL context (tens of milliseconds),
// so a successful result is shared for the life of the page.
let cachedProfile: WebGLProfile | null = null

export function resetWebGLProfileCache(): void {
  cachedProfile = null
}

export function detectWebGLProfile(): WebGLProfile {
  if (cachedProfile) return cachedProfile
  const profile = probeWebGLProfile()
  if (profile.available) cachedProfile = profile
  return profile
}

function probeWebGLProfile(): WebGLProfile {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!context) return UNAVAILABLE_PROFILE
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
    return UNAVAILABLE_PROFILE
  }
}

export function detectWebGL(): boolean {
  return detectWebGLProfile().available
}
