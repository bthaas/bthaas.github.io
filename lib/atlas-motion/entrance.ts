export const PRELOADER_DURATION_SECONDS = 1.18

export interface PreloaderFrame {
  readonly counter: number
  readonly curtain: number
  readonly glyph: number
  readonly lift: number
}

interface PreloaderEligibility {
  readonly reducedMotion: boolean
  readonly seen: boolean
}

interface FluidCursorEligibility {
  readonly finePointer: boolean
  readonly hover: boolean
  readonly reducedMotion: boolean
  readonly webgl: boolean
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function range(progress: number, start: number, end: number): number {
  return clamp((progress - start) / (end - start))
}

function smoothstep(value: number): number {
  const progress = clamp(value)
  return progress * progress * (3 - 2 * progress)
}

export function getPreloaderFrame(rawProgress: number): PreloaderFrame {
  const progress = clamp(rawProgress)
  const counterProgress = range(progress, 0, 0.62)

  return {
    counter: Math.min(100, Math.round(counterProgress * 20) * 5),
    curtain: smoothstep(range(progress, 0.72, 0.84)),
    glyph: smoothstep(range(progress, 0.06, 0.64)),
    lift: smoothstep(range(progress, 0.84, 1)),
  }
}

export function shouldRunPreloader({
  reducedMotion,
  seen,
}: PreloaderEligibility): boolean {
  return !reducedMotion && !seen
}

export function getFluidCursorEligibility({
  finePointer,
  hover,
  reducedMotion,
  webgl,
}: FluidCursorEligibility): boolean {
  return finePointer && hover && !reducedMotion && webgl
}
