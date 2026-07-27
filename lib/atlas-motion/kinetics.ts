export interface MagneticOffsetInput {
  readonly centerX: number
  readonly centerY: number
  readonly pointerX: number
  readonly pointerY: number
}

export interface MagneticOffset {
  readonly x: number
  readonly y: number
}

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.max(minimum, Math.min(maximum, value))
)
const round = (value: number) => Number(value.toFixed(3))

export function getMagneticOffset({
  centerX,
  centerY,
  pointerX,
  pointerY,
}: MagneticOffsetInput): MagneticOffset {
  return {
    x: round(clamp((pointerX - centerX) * 0.12, -6, 6)),
    y: round(clamp((pointerY - centerY) * 0.12, -6, 6)),
  }
}
