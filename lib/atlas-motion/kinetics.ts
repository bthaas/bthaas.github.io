export interface PlateVelocityFrame {
  readonly scale: number
  readonly skewY: number
}

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

export function getPlateVelocityFrame(velocity: number): PlateVelocityFrame {
  return {
    scale: round(1 + Math.min(Math.abs(velocity) / 300_000, 0.012)),
    skewY: round(clamp(velocity / 2_000, -1.5, 1.5)),
  }
}

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
