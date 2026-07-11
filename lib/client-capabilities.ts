export interface ClientCapabilities {
  readonly width: number
  readonly reducedMotion: boolean
  readonly webGLAvailable: boolean
}

export function shouldRenderWebGL({
  width,
  reducedMotion,
  webGLAvailable,
}: ClientCapabilities): boolean {
  return width >= 768 && !reducedMotion && webGLAvailable
}

export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
