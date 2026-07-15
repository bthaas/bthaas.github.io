import { clampProgress } from './curves'
import { mapProgress } from './progress'

const CHARACTER_GAP_EM = 0.02
const CONTACT_DOCUMENT_START = 0.88
const SUN_FINALE_START = 0.8
const SUN_FINALE_END = 0.98

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

export function getContactGlowProgress(contactProgress: number, sunProgress: number): number {
  const sunFinaleProgress = mapProgress(sunProgress, SUN_FINALE_START, SUN_FINALE_END)
  return round(Math.min(clampProgress(contactProgress), sunFinaleProgress))
}
