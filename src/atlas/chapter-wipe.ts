import { getViewportEntryRange } from '../../lib/atlas-motion/scroll-trigger-range'

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
      direction === 'rtl'
        ? { clipPath: 'inset(0 0 0 100%)' }
        : { clipPath: 'inset(0 100% 0 0)' },
      direction === 'rtl'
        ? { clipPath: 'inset(0 0 0 0%)', ease: 'none' }
        : { clipPath: 'inset(0 0% 0 0)', ease: 'none' },
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
