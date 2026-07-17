import { clampProgress } from './curves'

export interface DiveTrackRect {
  readonly bottom: number
  readonly height: number
  readonly top: number
}

export interface CoverRect {
  readonly dx: number
  readonly dy: number
  readonly dw: number
  readonly dh: number
  readonly sx: number
  readonly sy: number
  readonly sw: number
  readonly sh: number
}

const EMPTY_RECT: CoverRect = {
  dx: 0,
  dy: 0,
  dw: 0,
  dh: 0,
  sx: 0,
  sy: 0,
  sw: 0,
  sh: 0,
}

export function getSectionProgress(rect: DiveTrackRect, viewportHeight: number): number {
  const scrollableDistance = rect.height - viewportHeight
  if (scrollableDistance <= 0) return 0
  return clampProgress(-rect.top / scrollableDistance)
}

export function progressToFrame(progress: number, frameCount: number): number {
  if (frameCount <= 0) return 0
  return Math.min(frameCount - 1, Math.floor(clampProgress(progress) * frameCount))
}

export function getCoverRect(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
): CoverRect {
  if (canvasWidth <= 0 || canvasHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return EMPTY_RECT
  }

  const canvasRatio = canvasWidth / canvasHeight
  const imageRatio = imageWidth / imageHeight
  let sourceWidth = imageWidth
  let sourceHeight = imageHeight

  if (imageRatio > canvasRatio) sourceWidth = imageHeight * canvasRatio
  else sourceHeight = imageWidth / canvasRatio

  return {
    dx: 0,
    dy: 0,
    dw: canvasWidth,
    dh: canvasHeight,
    sx: (imageWidth - sourceWidth) / 2,
    sy: (imageHeight - sourceHeight) / 2,
    sw: sourceWidth,
    sh: sourceHeight,
  }
}

export function getWashAlpha(progress: number, start = 0.88): number {
  const washStart = clampProgress(start)
  if (washStart === 1) return progress >= 1 ? 1 : 0
  return clampProgress((progress - washStart) / (1 - washStart))
}

export function getPreloadOrder(frameCount: number, stride = 8): number[] {
  if (!Number.isInteger(stride) || stride < 1) {
    throw new RangeError('stride must be a positive integer')
  }
  if (!Number.isInteger(frameCount) || frameCount < 1) return []

  const order: number[] = []
  for (let index = 0; index < frameCount; index += stride) order.push(index)
  for (let index = 0; index < frameCount; index += 1) {
    if (index % stride !== 0) order.push(index)
  }
  return order
}
