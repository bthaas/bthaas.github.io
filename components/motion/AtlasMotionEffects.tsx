import { FeatherFallLayer } from '@/components/scenes/FeatherFallLayer'

import { AtlasPreloader } from './AtlasPreloader'
import { FluidCursorLayer } from './FluidCursorLayer'

export function AtlasMotionEffects() {
  return (
    <>
      <AtlasPreloader />
      <FeatherFallLayer />
      <FluidCursorLayer />
    </>
  )
}
