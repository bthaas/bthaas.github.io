'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

import { isPortfolioScreenPath } from '@/lib/atlas-routes'

// Code-split so editorial pages and case studies, which never render the layer,
// do not download its GSAP and WebGL loaders.
const AtlasMotionEffects = dynamic(
  () => import('./AtlasMotionEffects').then((module) => module.AtlasMotionEffects),
)

/**
 * Lives in the root layout so the WebGL feather scene and fluid cursor survive
 * client navigation between portfolio screens instead of rebuilding their
 * contexts and shaders on every route change.
 */
export function PersistentAtlasMotionEffects() {
  const pathname = usePathname()
  return isPortfolioScreenPath(pathname) ? <AtlasMotionEffects /> : null
}
