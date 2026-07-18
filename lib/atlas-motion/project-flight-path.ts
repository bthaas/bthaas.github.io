export interface ProjectAnchorInput {
  readonly count: number
  readonly headerOffset: number
  readonly index: number
  readonly pinDistance: number
  readonly pinStart: number
}

export interface ProjectFlightFrame {
  bend: number
  skewDegrees: number
  uvShift: number
}

export interface ChapterDissolveFrame {
  readonly dotRadius: number
  readonly offsetX: number
}

export interface NormalizedPointer {
  readonly x: number
  readonly y: number
}

export interface FlightLogTilt {
  readonly rotateX: number
  readonly rotateY: number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

export function getProjectTrackTravel(trackWidth: number, viewportWidth: number) {
  return Math.max(0, trackWidth - Math.max(0, viewportWidth))
}

export function getProjectPanelProgress(index: number, count: number) {
  if (count <= 1) return 0
  return clamp(index / (count - 1), 0, 1)
}

export function getProjectAnchorScrollY({
  count,
  headerOffset,
  index,
  pinDistance,
  pinStart,
}: ProjectAnchorInput) {
  return Math.max(
    0,
    pinStart - headerOffset + pinDistance * getProjectPanelProgress(index, count),
  )
}

export function getProjectFlightFrame(
  velocity: number,
  target: ProjectFlightFrame = { bend: 0, skewDegrees: 0, uvShift: 0 },
): ProjectFlightFrame {
  const finiteVelocity = Number.isFinite(velocity) ? velocity : 0
  target.bend = clamp(Math.abs(finiteVelocity) / 20_000, 0, 0.008)
  target.skewDegrees = clamp(finiteVelocity / 32, -5, 5)
  target.uvShift = clamp(finiteVelocity / 20_000, -0.008, 0.008)
  return target
}

export function getChapterDissolveFrame(
  progress: number,
  direction: -1 | 1,
): ChapterDissolveFrame {
  const clampedProgress = clamp(progress, 0, 1)
  return {
    dotRadius: clampedProgress * 9,
    offsetX: (1 - clampedProgress) * 12 * direction,
  }
}

export function getFlightLogTilt(
  pointer: NormalizedPointer,
  maximumDegrees = 6,
): FlightLogTilt {
  const limit = Math.max(0, maximumDegrees)
  return {
    rotateX: -clamp(pointer.y, -1, 1) * limit,
    rotateY: clamp(pointer.x, -1, 1) * limit,
  }
}
