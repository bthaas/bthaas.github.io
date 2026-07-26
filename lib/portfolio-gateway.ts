export interface GatewayCategory {
  readonly id: 'experience' | 'projects' | 'skills' | 'contact'
  readonly label: 'Experience' | 'Projects' | 'Skills' | 'Contact'
  readonly href: '/experience' | '/projects' | '/skills' | '/contact'
  readonly image: `/icarus-atlas/${string}.avif`
}

export const GATEWAY_CATEGORIES = [
  {
    id: 'experience',
    label: 'Experience',
    href: '/experience',
    image: '/icarus-atlas/experience-trajectory-960.avif',
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    image: '/icarus-atlas/project-courtvision-640.avif',
  },
  {
    id: 'skills',
    label: 'Skills',
    href: '/skills',
    image: '/icarus-atlas/craft-workshop-960.avif',
  },
  {
    id: 'contact',
    label: 'Contact',
    href: '/contact',
    image: '/icarus-atlas/ending-horizon-960.avif',
  },
] as const satisfies readonly GatewayCategory[]

export const GATEWAY_SEGMENTS_PER_CATEGORY = 12
const GATEWAY_CATEGORY_DEGREES = 90
const GATEWAY_FACE_DEGREES = 88
const GATEWAY_SEGMENT_DEGREES = GATEWAY_FACE_DEGREES / GATEWAY_SEGMENTS_PER_CATEGORY

export const GATEWAY_CYLINDER_SEGMENTS = GATEWAY_CATEGORIES.flatMap(
  (category, categoryIndex) => Array.from(
    { length: GATEWAY_SEGMENTS_PER_CATEGORY },
    (_, segmentIndex) => ({
      angle: categoryIndex * GATEWAY_CATEGORY_DEGREES
        - GATEWAY_FACE_DEGREES / 2
        + GATEWAY_SEGMENT_DEGREES * (segmentIndex + 0.5),
      categoryId: category.id,
      categoryIndex,
      id: `${category.id}-${segmentIndex + 1}`,
      imagePosition: segmentIndex / (GATEWAY_SEGMENTS_PER_CATEGORY - 1) * 100,
      segmentIndex,
    }),
  ),
)

export function getWrappedGatewayIndex(index: number): number {
  const length = GATEWAY_CATEGORIES.length
  return ((index % length) + length) % length
}

export function getGatewayRotation(index: number): number {
  return index === 0 ? 0 : index * -GATEWAY_CATEGORY_DEGREES
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
