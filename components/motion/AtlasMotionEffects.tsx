import { FeatherFallLayer } from '@/components/scenes/FeatherFallLayer'

import { AtlasSpectacle } from './AtlasSpectacle'
import { FluidCursorLayer } from './FluidCursorLayer'

export function AtlasMotionEffects() {
  return (
    <>
      <AtlasSpectacle />
      <FeatherFallLayer />
      <FluidCursorLayer />
    </>
  )
}
