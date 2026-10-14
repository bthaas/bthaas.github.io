import { SRGBColorSpace, type Texture } from 'three'

import type { ProjectView } from './project-spiral'

export function shouldAnimateProjectViewTransition(
  reducedMotion: boolean,
  currentView: ProjectView,
  nextView: ProjectView,
) {
  return !reducedMotion && currentView !== nextView
}

export function configureProjectSpiralTexture(
  texture: Texture,
  maximumAnisotropy: number,
) {
  texture.flipY = false
  texture.anisotropy = Math.min(8, maximumAnisotropy)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
}

export interface ProjectSpiralMotionGaps {
  readonly phaseGap: number
  readonly rotationGapX: number
  readonly rotationGapY: number
  readonly velocity: number
}

// Below these gaps the remaining easing is sub-pixel: velocity skew is
// velocity * 0.0014 rad, so 0.1 px/s leaves under 0.0002 rad of tilt.
const PHASE_EPSILON = 1e-4
const ROTATION_EPSILON = 1e-4
const VELOCITY_EPSILON = 0.1

/** True while scroll or pointer input is still easing the spiral, as opposed to the idle bob. */
export function isProjectSpiralInMotion({
  phaseGap,
  rotationGapX,
  rotationGapY,
  velocity,
}: ProjectSpiralMotionGaps): boolean {
  return Math.abs(phaseGap) > PHASE_EPSILON
    || Math.abs(velocity) > VELOCITY_EPSILON
    || Math.abs(rotationGapX) > ROTATION_EPSILON
    || Math.abs(rotationGapY) > ROTATION_EPSILON
}
