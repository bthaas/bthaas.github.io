export interface AtlasVisual {
  readonly src: `/icarus-atlas/${string}.avif`
  readonly fallback: `/icarus-atlas/${string}.webp`
  readonly smallSrc: `/icarus-atlas/${string}.avif`
  readonly smallFallback: `/icarus-atlas/${string}.webp`
  readonly width: number
  readonly height: number
  readonly smallWidth: number
}

export const atlasVisuals = {
  hero: {
    src: '/icarus-atlas/hero-flight-1600.avif',
    fallback: '/icarus-atlas/hero-flight-1600.webp',
    smallSrc: '/icarus-atlas/hero-flight-960.avif',
    smallFallback: '/icarus-atlas/hero-flight-960.webp',
    width: 1600,
    height: 1130,
    smallWidth: 960,
  },
  craft: {
    src: '/icarus-atlas/craft-workshop-1600.avif',
    fallback: '/icarus-atlas/craft-workshop-1600.webp',
    smallSrc: '/icarus-atlas/craft-workshop-960.avif',
    smallFallback: '/icarus-atlas/craft-workshop-960.webp',
    width: 1600,
    height: 1065,
    smallWidth: 960,
  },
  experience: {
    src: '/icarus-atlas/experience-trajectory-1600.avif',
    fallback: '/icarus-atlas/experience-trajectory-1600.webp',
    smallSrc: '/icarus-atlas/experience-trajectory-960.avif',
    smallFallback: '/icarus-atlas/experience-trajectory-960.webp',
    width: 1600,
    height: 1067,
    smallWidth: 960,
  },
  projects: {
    courtvision: {
      src: '/icarus-atlas/project-courtvision-1200.avif',
      fallback: '/icarus-atlas/project-courtvision-1200.webp',
      smallSrc: '/icarus-atlas/project-courtvision-640.avif',
      smallFallback: '/icarus-atlas/project-courtvision-640.webp',
      width: 1200,
      height: 848,
      smallWidth: 640,
    },
    beatstream: {
      src: '/icarus-atlas/project-beatstream-1200.avif',
      fallback: '/icarus-atlas/project-beatstream-1200.webp',
      smallSrc: '/icarus-atlas/project-beatstream-640.avif',
      smallFallback: '/icarus-atlas/project-beatstream-640.webp',
      width: 1200,
      height: 686,
      smallWidth: 640,
    },
    'vision-bias-steering': {
      src: '/icarus-atlas/project-vision-bias-steering-1200.avif',
      fallback: '/icarus-atlas/project-vision-bias-steering-1200.webp',
      smallSrc: '/icarus-atlas/project-vision-bias-steering-640.avif',
      smallFallback: '/icarus-atlas/project-vision-bias-steering-640.webp',
      width: 1200,
      height: 915,
      smallWidth: 640,
    },
  },
  ending: {
    src: '/icarus-atlas/ending-horizon-1600.avif',
    fallback: '/icarus-atlas/ending-horizon-1600.webp',
    smallSrc: '/icarus-atlas/ending-horizon-960.avif',
    smallFallback: '/icarus-atlas/ending-horizon-960.webp',
    width: 1600,
    height: 758,
    smallWidth: 960,
  },
} as const satisfies Record<string, AtlasVisual | Record<string, AtlasVisual>>
