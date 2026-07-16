import type { AtlasVisual } from '@/content/editorial-visuals'

interface AtlasPictureProps {
  readonly visual: AtlasVisual
  readonly alt: string
  readonly className?: string
  readonly cursor?: 'expand'
  readonly priority?: boolean
  readonly projectPan?: boolean
  readonly projectPanIndex?: number
  readonly reveal?: boolean
  readonly sizes: string
}

export function AtlasPicture({
  visual,
  alt,
  className,
  cursor,
  priority = false,
  projectPan = false,
  projectPanIndex,
  reveal = false,
  sizes,
}: AtlasPictureProps) {
  return (
    <picture
      className={className}
      data-cursor={cursor}
      data-project-pan={projectPan ? '' : undefined}
      data-project-pan-index={projectPan ? projectPanIndex : undefined}
      data-reveal={reveal ? '' : undefined}
    >
      <source
        type="image/avif"
        srcSet={`${visual.smallSrc} ${visual.smallWidth}w, ${visual.src} ${visual.width}w`}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={`${visual.smallFallback} ${visual.smallWidth}w, ${visual.fallback} ${visual.width}w`}
        sizes={sizes}
      />
      <img
        src={visual.fallback}
        srcSet={`${visual.smallFallback} ${visual.smallWidth}w, ${visual.fallback} ${visual.width}w`}
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
