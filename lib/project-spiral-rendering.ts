import { SRGBColorSpace, type Texture } from 'three'

export function configureProjectSpiralTexture(
  texture: Texture,
  maximumAnisotropy: number,
) {
  texture.flipY = false
  texture.anisotropy = Math.min(8, maximumAnisotropy)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
}
