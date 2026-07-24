export interface GatewayCategory {
  readonly id: 'experience' | 'projects' | 'skills'
  readonly label: 'Experience' | 'Projects' | 'Skills'
  readonly href: '#experience' | '#projects' | '#craft'
  readonly image: `/icarus-atlas/${string}.avif`
}

export const GATEWAY_CATEGORIES = [
  {
    id: 'experience',
    label: 'Experience',
    href: '#experience',
    image: '/icarus-atlas/experience-trajectory-960.avif',
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '#projects',
    image: '/icarus-atlas/project-courtvision-640.avif',
  },
  {
    id: 'skills',
    label: 'Skills',
    href: '#craft',
    image: '/icarus-atlas/craft-workshop-960.avif',
  },
] as const satisfies readonly GatewayCategory[]

export function getWrappedGatewayIndex(index: number): number {
  const length = GATEWAY_CATEGORIES.length
  return ((index % length) + length) % length
}

export function getGatewayRotation(index: number): number {
  return index === 0 ? 0 : index * -120
}

const GATEWAY_DRAG_DEGREES_PER_WIDTH = 180
const GATEWAY_DRAG_WIDTHS_PER_STEP = 0.42

export function getGatewayDragRotation(deltaX: number, width: number): number {
  if (!Number.isFinite(deltaX) || !Number.isFinite(width) || width <= 0) return 0
  return (deltaX / width) * GATEWAY_DRAG_DEGREES_PER_WIDTH
}

export function getGatewayStepDeltaFromDrag(deltaX: number, width: number): number {
  if (!Number.isFinite(deltaX) || !Number.isFinite(width) || width <= 0) return 0
  const stepDelta = Math.round(-deltaX / (width * GATEWAY_DRAG_WIDTHS_PER_STEP))
  return stepDelta === 0 ? 0 : stepDelta
}
