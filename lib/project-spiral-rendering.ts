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
