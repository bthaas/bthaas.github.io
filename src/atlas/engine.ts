import { gsap } from 'gsap'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

type MatchMedia = (query: string) => Pick<MediaQueryList, 'matches'>

export interface AtlasEngine {
  readonly ScrollTrigger: typeof ScrollTrigger
  readonly destroy: () => void
  readonly gsap: typeof gsap
  readonly isCoarsePointer: boolean
  readonly lenis: Lenis
  readonly plugins: {
    readonly ScrambleTextPlugin: typeof ScrambleTextPlugin
  }
}

interface AtlasEngineOptions {
  readonly matchMedia?: MatchMedia
}

let activeEngine: AtlasEngine | null = null

export function getAtlasEngine(): AtlasEngine | null {
  return activeEngine
}

export function initializeAtlasEngine({
  matchMedia = (query) => window.matchMedia(query),
}: AtlasEngineOptions = {}): AtlasEngine | null {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  if (activeEngine) return activeEngine

  const isCoarsePointer = matchMedia('(pointer: coarse)').matches
  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin)

  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.14,
    smoothWheel: !isCoarsePointer,
    syncTouch: false,
  })
  const updateScrollTrigger = ScrollTrigger.update
  const tick = (time: number) => lenis.raf(time * 1000)

  lenis.on('scroll', updateScrollTrigger)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  let isActive = true
  const engine: AtlasEngine = {
    ScrollTrigger,
    gsap,
    isCoarsePointer,
    lenis,
    plugins: {
      ScrambleTextPlugin,
    },
    destroy: () => {
      if (!isActive) return
      isActive = false
      gsap.ticker.remove(tick)
      lenis.off('scroll', updateScrollTrigger)
      lenis.destroy()
      if (activeEngine === engine) activeEngine = null
    },
  }

  activeEngine = engine
  return engine
}
