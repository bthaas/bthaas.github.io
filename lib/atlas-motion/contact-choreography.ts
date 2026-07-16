import { clampProgress } from './curves'
import { mapProgress } from './progress'

const CHARACTER_GAP_EM = 0.02
const CONTACT_DOCUMENT_START = 0.88
const SUN_FINALE_START = 0.8
const SUN_FINALE_END = 0.98
const CONTACT_PLATE_END = 0.34
const CONTACT_IMAGE_TRAVEL_PERCENT = 5
const DETAIL_REVEAL_WINDOWS = [
  [0.02, 0.18],
  [0.28, 0.5],
  [0.44, 0.62],
  [0.5, 0.68],
  [0.56, 0.74],
  [0.72, 0.92],
] as const

export interface ContactScrollMetrics {
  readonly elementHeight: number
  readonly elementTop: number
  readonly scrollY: number
  readonly viewportHeight: number
}

const round = (value: number): number => {
  const rounded = Number(value.toFixed(4))
  return Object.is(rounded, -0) ? 0 : rounded
}

export function getContactScrollProgress({
  elementHeight,
  elementTop,
  scrollY,
  viewportHeight,
}: ContactScrollMetrics): number {
  const entryScroll = elementTop - viewportHeight
  const endingScroll = Math.max(entryScroll, elementTop + elementHeight - viewportHeight)
  if (endingScroll === entryScroll) return scrollY >= endingScroll ? 1 : 0
  return mapProgress(scrollY, entryScroll, endingScroll)
}

export function getContactCharacterOffsetEm(
  index: number,
  characterCount: number,
  progress: number,
): number {
  if (characterCount < 2) return 0
  const distanceFromCenter = index - (characterCount - 1) / 2
  return round(distanceFromCenter * CHARACTER_GAP_EM * clampProgress(progress))
}

export function getContactDocumentProgress(documentProgress: number): number {
  return mapProgress(documentProgress, CONTACT_DOCUMENT_START, 1)
}

export function getContactWordRevealProgress(progress: number, index: number): number {
  const start = 0.04 + index * 0.06
  return mapProgress(progress, start, start + 0.18)
}

export function getContactPlateRevealProgress(progress: number): number {
  return mapProgress(progress, 0, CONTACT_PLATE_END)
}

export function getContactImageOffsetPercent(progress: number): number {
  return round((0.5 - clampProgress(progress)) * CONTACT_IMAGE_TRAVEL_PERCENT)
}

export function getContactDetailRevealProgress(progress: number, index: number): number {
  const revealWindow = DETAIL_REVEAL_WINDOWS[index]
  if (!revealWindow) throw new RangeError('contact detail index is out of range')
  return mapProgress(progress, revealWindow[0], revealWindow[1])
}

export function getContactGlowProgress(contactProgress: number, sunProgress: number): number {
  const sunFinaleProgress = mapProgress(sunProgress, SUN_FINALE_START, SUN_FINALE_END)
  return round(Math.min(clampProgress(contactProgress), sunFinaleProgress))
}
