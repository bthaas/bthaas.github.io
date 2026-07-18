import { getViewportEntryRange } from '../../lib/atlas-motion/scroll-trigger-range'
import { getChapterDissolveFrame } from '../../lib/atlas-motion/project-flight-path'

import { getAtlasEngine, type AtlasEngine } from './engine'

export function setupChapterWipes(
  root: Document = document,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const chapters = Array.from(root.querySelectorAll<HTMLElement>('[data-chapter-wipe]'))
  if (chapters.length === 0 || !engine) return () => undefined
  const runtimeWindow = root.defaultView ?? window

  const layers = chapters.map((chapter, index) => {
    const layer = root.createElement('span')
    const direction = chapter.dataset.wipeDirection ?? (index % 2 === 0 ? 'ltr' : 'rtl')
    const directionSign = direction === 'rtl' ? -1 : 1
    const from = getChapterDissolveFrame(0, directionSign)
    const to = getChapterDissolveFrame(1, directionSign)
    layer.className = 'chapter-wipe__layer'
    layer.setAttribute('aria-hidden', 'true')
    chapter.append(layer)
    const measureRange = () => getViewportEntryRange({
      elementTop: chapter.getBoundingClientRect().top + runtimeWindow.scrollY,
      endViewportRatio: 0.22,
      startViewportRatio: 0.92,
      viewportHeight: runtimeWindow.innerHeight,
    })

    const timeline = engine.gsap.timeline({
      scrollTrigger: {
        trigger: chapter,
        start: () => measureRange().start,
        end: () => measureRange().end,
        refreshPriority: 1,
        scrub: 0.7,
      },
    })
    timeline.fromTo(
      layer,
      {
        '--chapter-dot-radius': `${from.dotRadius}px`,
        '--chapter-dot-x': `${from.offsetX}px`,
      },
      {
        '--chapter-dot-radius': `${to.dotRadius}px`,
        '--chapter-dot-x': `${to.offsetX}px`,
        ease: 'none',
      },
      0,
    )
    return { layer, timeline }
  })

  return () => {
    layers.forEach(({ layer, timeline }) => {
      timeline.kill()
      layer.remove()
    })
  }
}
