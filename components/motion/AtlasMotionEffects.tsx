import { FeatherFallLayer } from '@/components/scenes/FeatherFallLayer'

import { AtlasPreloader } from './AtlasPreloader'
import { AtlasSpectacle } from './AtlasSpectacle'
import { FluidCursorLayer } from './FluidCursorLayer'

export function AtlasMotionEffects() {
  return (
    <>
      <AtlasPreloader />
      <AtlasSpectacle />
      <FeatherFallLayer />
      <FluidCursorLayer />
    </>
  )
}
