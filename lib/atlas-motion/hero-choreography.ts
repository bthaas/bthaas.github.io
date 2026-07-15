import { clampProgress, smoothstep, steppedProgress } from './curves'

interface TimedPhase {
  readonly durationMs: number
  readonly startMs: number
}

export interface EntranceTimeline {
  readonly characterDurationMs: number
  readonly characterStaggerMs: number
  readonly characterStartMs: readonly number[]
  readonly chrome: TimedPhase
  readonly grain: TimedPhase
  readonly mastheadStartMs: number
  readonly plate: TimedPhase
  readonly totalMs: number
}

export interface HeroExitInput {
  readonly elementHeight: number
  readonly elementTop: number
  readonly scrollY: number
}

export interface HeroParallaxFrame {
  readonly captionTranslateVh: number
  readonly imageTranslatePercent: number
  readonly plateScale: number
}

const CHARACTER_DURATION_MS = 360
const CHARACTER_STAGGER_MS = 60
const MASTHEAD_START_MS = 360

export function getEntranceTimeline(characterCount: number): EntranceTimeline {
  const safeCount = Math.max(0, Math.floor(characterCount))
  const characterStartMs = Array.from(
    { length: safeCount },
    (_, index) => MASTHEAD_START_MS + index * CHARACTER_STAGGER_MS,
  )
  const lastCharacterEnd = safeCount === 0
    ? MASTHEAD_START_MS
    : characterStartMs[safeCount - 1] + CHARACTER_DURATION_MS
  const plate = { durationMs: 700, startMs: 0 }
  const grain = { durationMs: 120, startMs: 100 }
  const chrome = { durationMs: 240, startMs: 900 }

  return {
    characterDurationMs: CHARACTER_DURATION_MS,
    characterStaggerMs: CHARACTER_STAGGER_MS,
    characterStartMs,
    chrome,
    grain,
    mastheadStartMs: MASTHEAD_START_MS,
    plate,
    totalMs: Math.max(
      plate.startMs + plate.durationMs,
      grain.startMs + grain.durationMs,
      chrome.startMs + chrome.durationMs,
      lastCharacterEnd,
    ),
  }
}

export function getHeroExitProgress({
  elementHeight,
  elementTop,
  scrollY,
}: HeroExitInput): number {
  if (elementHeight <= 0) return 0
  return clampProgress((scrollY - elementTop) / elementHeight)
}

export function getHeroParallax(progress: number): HeroParallaxFrame {
  const bounded = clampProgress(progress)
  return {
    captionTranslateVh: bounded === 0 ? 0 : -2.5 * bounded,
    imageTranslatePercent: Math.round(10.7 * bounded * 1000) / 1000,
    plateScale: Math.round((1.05 - 0.05 * bounded) * 1000) / 1000,
  }
}

export function getMetricCountProgress(progress: number, steps = 30): number {
  return steppedProgress(smoothstep(progress), steps)
}
