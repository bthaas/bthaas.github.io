export const SUN_SPECTACLE_DURATION_MS = 3_800

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const

export interface KonamiAdvance {
  readonly complete: boolean
  readonly index: number
}

export interface SunSpectacleFrame {
  blizzard: number
  complete: boolean
  flare: number
  goldArc: number
  goldProgress: number
  goldRotation: number
  progress: number
}

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value))

const smoothstep = (value: number) => {
  const progress = clamp(value)
  return progress * progress * (3 - 2 * progress)
}

const windowProgress = (progress: number, start: number, end: number) =>
  clamp((progress - start) / Math.max(0.0001, end - start))

export function advanceKonamiSequence(index: number, key: string): KonamiAdvance {
  const normalized = key.length === 1 ? key.toLowerCase() : key
  const safeIndex = Math.max(0, Math.min(KONAMI_SEQUENCE.length - 1, index))
  if (normalized === KONAMI_SEQUENCE[safeIndex]) {
    const nextIndex = safeIndex + 1
    return nextIndex === KONAMI_SEQUENCE.length
      ? { complete: true, index: 0 }
      : { complete: false, index: nextIndex }
  }
  return {
    complete: false,
    index: normalized === KONAMI_SEQUENCE[0] ? 1 : 0,
  }
}

export function createSunSpectacleFrame(): SunSpectacleFrame {
  return {
    blizzard: 0,
    complete: false,
    flare: 0,
    goldArc: 0,
    goldProgress: 0,
    goldRotation: 0,
    progress: 0,
  }
}

export function writeSunSpectacleFrame(
  elapsedMs: number,
  target: SunSpectacleFrame,
): SunSpectacleFrame {
  const progress = clamp(elapsedMs / SUN_SPECTACLE_DURATION_MS)
  const flareRise = smoothstep(windowProgress(progress, 0, 0.055))
  const flareFall = 1 - smoothstep(windowProgress(progress, 0.055, 0.36))
  const blizzardRise = smoothstep(windowProgress(progress, 0.015, 0.18))
  const blizzardFall = 1 - smoothstep(windowProgress(progress, 0.52, 0.88))
  const goldProgress = smoothstep(windowProgress(progress, 0.16, 0.92))

  target.progress = progress
  target.flare = flareRise * flareFall
  target.blizzard = blizzardRise * blizzardFall
  target.goldProgress = goldProgress
  target.goldArc = Math.sin(goldProgress * Math.PI)
  target.goldRotation = goldProgress * 960
  target.complete = progress >= 1
  return target
}
