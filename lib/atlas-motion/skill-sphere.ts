export interface SphereVector {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface SphereProjection {
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly opacity: number
  readonly z: number
}

export interface MutableSphereProjection {
  x: number
  y: number
  scale: number
  opacity: number
  z: number
}

export const MAX_SKILL_SPHERE_PITCH = 1.5

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const MIN_SCALE = 0.55
const MIN_OPACITY = 0.3

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
)

export function fibonacciSphere(count: number): readonly SphereVector[] {
  const total = Math.max(0, Math.floor(count))
  if (total === 0) return []

  return Array.from({ length: total }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / total
    const latitudeRadius = Math.sqrt(Math.max(0, 1 - y * y))
    const angle = index * GOLDEN_ANGLE
    return {
      x: Math.cos(angle) * latitudeRadius,
      y,
      z: Math.sin(angle) * latitudeRadius,
    }
  })
}

export function rotatePoint(
  point: SphereVector,
  yaw: number,
  pitch: number,
): SphereVector {
  const yawCosine = Math.cos(yaw)
  const yawSine = Math.sin(yaw)
  const pitchCosine = Math.cos(pitch)
  const pitchSine = Math.sin(pitch)
  const yawX = point.x * yawCosine + point.z * yawSine
  const yawZ = -point.x * yawSine + point.z * yawCosine

  return {
    x: yawX,
    y: point.y * pitchCosine - yawZ * pitchSine,
    z: point.y * pitchSine + yawZ * pitchCosine,
  }
}

export function projectPoint(
  point: SphereVector,
  radius: number,
  size: number,
): SphereProjection {
  const depth = clamp((point.z + 1) / 2, 0, 1)
  return {
    x: size / 2 + point.x * radius,
    y: size / 2 + point.y * radius,
    scale: MIN_SCALE + (1 - MIN_SCALE) * depth,
    opacity: MIN_OPACITY + (1 - MIN_OPACITY) * depth,
    z: Math.round(depth * 200),
  }
}

export function projectSpherePointInto(
  point: SphereVector,
  yaw: number,
  pitch: number,
  radius: number,
  centerX: number,
  centerY: number,
  target: MutableSphereProjection,
): MutableSphereProjection {
  const yawCosine = Math.cos(yaw)
  const yawSine = Math.sin(yaw)
  const pitchCosine = Math.cos(pitch)
  const pitchSine = Math.sin(pitch)
  const rotatedX = point.x * yawCosine + point.z * yawSine
  const yawZ = -point.x * yawSine + point.z * yawCosine
  const rotatedY = point.y * pitchCosine - yawZ * pitchSine
  const rotatedZ = point.y * pitchSine + yawZ * pitchCosine
  const depth = clamp((rotatedZ + 1) / 2, 0, 1)

  target.x = centerX + rotatedX * radius
  target.y = centerY + rotatedY * radius
  target.scale = MIN_SCALE + (1 - MIN_SCALE) * depth
  target.opacity = MIN_OPACITY + (1 - MIN_OPACITY) * depth
  target.z = Math.round(depth * 200)
  return target
}

export function clampPitch(pitch: number): number {
  return clamp(pitch, -MAX_SKILL_SPHERE_PITCH, MAX_SKILL_SPHERE_PITCH)
}

export function decayVelocity(
  velocity: number,
  idleFloor = 0,
  decay = 0.95,
  idleEase = 0.08,
): number {
  if (idleFloor === 0) {
    const decayed = velocity * decay
    return Math.abs(decayed) < 0.00001 ? 0 : decayed
  }

  if (velocity > idleFloor) return Math.max(idleFloor, velocity * decay)
  if (velocity === idleFloor) return idleFloor
  return velocity + (idleFloor - velocity) * idleEase
}
