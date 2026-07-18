import type { AtlasVisual } from '@/content/editorial-visuals'

interface AtlasPictureProps {
  readonly visual: AtlasVisual
  readonly alt: string
  readonly className?: string
  readonly cursor?: 'expand' | 'read'
  readonly printReveal?: boolean
  readonly priority?: boolean
  readonly projectPan?: boolean
  readonly projectPanIndex?: number
  readonly reveal?: boolean
  readonly sizes: string
  readonly velocityPlate?: boolean
}

function getSourceSet(visual: AtlasVisual, format: 'avif' | 'webp') {
  const sources: string[] = []
  if (visual.tinyWidth) {
    const tinySource = format === 'avif' ? visual.tinySrc : visual.tinyFallback
    if (tinySource) sources.push(`${tinySource} ${visual.tinyWidth}w`)
  }
  if (visual.mediumWidth) {
    const mediumSource = format === 'avif' ? visual.mediumSrc : visual.mediumFallback
    if (mediumSource) sources.push(`${mediumSource} ${visual.mediumWidth}w`)
  }
  sources.push(
    `${format === 'avif' ? visual.smallSrc : visual.smallFallback} ${visual.smallWidth}w`,
    `${format === 'avif' ? visual.src : visual.fallback} ${visual.width}w`,
  )
  return sources.join(', ')
}

export function AtlasPicture({
  visual,
  alt,
  className,
  cursor,
  printReveal = false,
  priority = false,
  projectPan = false,
  projectPanIndex,
  reveal = false,
  sizes,
  velocityPlate = false,
}: AtlasPictureProps) {
  return (
    <picture
      className={className}
      data-atlas-print-plate={printReveal ? '' : undefined}
      data-atlas-velocity-plate={velocityPlate ? '' : undefined}
      data-cursor={cursor}
      data-project-pan={projectPan ? '' : undefined}
      data-project-pan-index={projectPan ? projectPanIndex : undefined}
      data-reveal={reveal ? '' : undefined}
    >
      <source
        type="image/avif"
        srcSet={getSourceSet(visual, 'avif')}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={getSourceSet(visual, 'webp')}
        sizes={sizes}
      />
      <img
        src={visual.fallback}
        srcSet={getSourceSet(visual, 'webp')}
        sizes={sizes}
        alt={alt}
        width={visual.width}
        height={visual.height}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding={priority ? 'sync' : 'async'}
      />
    </picture>
  )
}
