const FULL_TURN = Math.PI * 2
const DEFAULT_TURNS = 2

export const PROJECT_SPIRAL_SLOT_ORDER = [0, 1, 0, 2, 1, 2, 0, 2, 1] as const

interface ProjectSpiralFrameInput {
  readonly phase: number
  readonly slotCount: number
  readonly slotIndex: number
  readonly velocity: number
}

export interface ProjectSpiralFrame {
  readonly angle: number
  readonly depth: number
  readonly opacity: number
  readonly rotationY: number
  readonly scale: number
  readonly velocitySkew: number
  readonly x: number
  readonly y: number
  readonly zIndex: number
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

function getCenteredSlot(slotIndex: number, phase: number, slotCount: number) {
  const half = slotCount / 2
  return positiveModulo(slotIndex - phase + half, slotCount) - half
}

export function getProjectSpiralFrame({
  phase,
  slotCount,
  slotIndex,
  velocity,
}: ProjectSpiralFrameInput): ProjectSpiralFrame {
  if (slotCount < 3) throw new Error('Project spiral requires at least three slots')
  const centeredSlot = getCenteredSlot(slotIndex, phase, slotCount)
  const angle = centeredSlot * FULL_TURN / slotCount
  const depth = Math.cos(angle)
  const depthProgress = (depth + 1) / 2

  return {
    angle,
    depth,
    opacity: 0.46 + depthProgress * 0.54,
    rotationY: angle * 0.92,
    scale: 0.62 + depthProgress * 0.46,
    velocitySkew: Math.max(-0.14, Math.min(0.14, velocity * 0.0014)),
    x: Math.sin(angle),
    y: -centeredSlot * 0.285,
    zIndex: Math.round(depth * 1_000),
  }
}

export function getProjectSpiralPhase(progress: number, slotCount: number) {
  const boundedProgress = Math.max(0, Math.min(1, progress))
  return boundedProgress * slotCount * DEFAULT_TURNS
}

export function getFrontProjectIndex(
  phase: number,
  slotCount: number,
  projectCount: number,
) {
  if (slotCount < 1 || projectCount < 1) return 0
  const frontSlot = positiveModulo(Math.round(phase), slotCount)
  return PROJECT_SPIRAL_SLOT_ORDER[frontSlot % PROJECT_SPIRAL_SLOT_ORDER.length]
    % projectCount
}
