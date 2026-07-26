export const GATEWAY_ENTRANCE_DURATION_SECONDS = 2.6
export const GATEWAY_ENTRANCE_STORAGE_KEY = 'atlas-gateway-entered'

export type GatewayEntranceState = 'entering' | 'pending' | 'settled'

export interface GatewaySliceEntrance {
  readonly delay: number
  readonly fallDistance: number
  readonly rotationX: number
  readonly rotationY: number
  readonly rotationZ: number
  readonly scale: number
  readonly x: number
}

interface GatewayEntranceEligibility {
  readonly reducedMotion: boolean
  readonly seen: boolean
}

function normalizeAngle(angle: number): number {
  return ((angle + 180) % 360 + 360) % 360 - 180
}

function seededUnit(index: number, salt: number): number {
  let value = Math.imul(index + 1, 0x45d9f3b) ^ salt
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  value ^= value >>> 16
  return (value >>> 0) / 0xffffffff
}

export function getGatewaySliceEntrance(
  index: number,
  angle: number,
  viewportHeight: number,
): GatewaySliceEntrance {
  const safeViewportHeight = Number.isFinite(viewportHeight) && viewportHeight > 0
    ? viewportHeight
    : 800
  const frontness = (Math.cos(normalizeAngle(angle) * Math.PI / 180) + 1) / 2
  const direction = index % 2 === 0 ? -1 : 1

  return {
    delay: 0.04 + frontness * 0.76 + seededUnit(index, 11) * 0.018,
    fallDistance: safeViewportHeight * (0.86 + seededUnit(index, 23) * 0.38),
    rotationX: (seededUnit(index, 31) * 2 - 1) * 15,
    rotationY: (seededUnit(index, 41) * 2 - 1) * 21,
    rotationZ: direction * (3.5 + seededUnit(index, 53) * 8),
    scale: 0.91 + seededUnit(index, 67) * 0.08,
    x: direction * (18 + seededUnit(index, 79) * 74),
  }
}

export function shouldRunGatewayEntrance({
  reducedMotion,
  seen,
}: GatewayEntranceEligibility): boolean {
  return !reducedMotion && !seen
}

export function isGatewayEntranceInteractive(state: GatewayEntranceState): boolean {
  return state === 'settled'
}
