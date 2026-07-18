import {
  getElementTraversalRange,
  getViewportEntryRange,
} from '../../lib/atlas-motion/scroll-trigger-range'

import { getAtlasEngine, type AtlasEngine } from './engine'

export function setupCraftChapter(
  root: Document = document,
  runtimeWindow: Window = window,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const section = root.querySelector<HTMLElement>('.craft-section')
  const plate = root.querySelector<HTMLElement>('.craft-art')
  const panel = section?.querySelector<HTMLElement>('.craft-panel')
  const heading = section?.querySelector<HTMLElement>('.craft-heading')
  const copy = section?.querySelector<HTMLElement>('.craft-copy')
  const ghost = section?.querySelector<HTMLElement>('.craft-ghost')
  const image = plate?.querySelector<HTMLImageElement>('img')
  if (!section || !plate || !panel || !heading || !ghost || !image || !engine) {
    return () => undefined
  }
  const measurePlateRange = () => getViewportEntryRange({
    elementTop: plate.getBoundingClientRect().top + runtimeWindow.scrollY,
    endViewportRatio: 0.28,
    startViewportRatio: 0.92,
    viewportHeight: runtimeWindow.innerHeight,
  })
  const measureSectionRange = () => {
    const bounds = section.getBoundingClientRect()
    return getElementTraversalRange({
      elementHeight: bounds.height,
      elementTop: bounds.top + runtimeWindow.scrollY,
      viewportHeight: runtimeWindow.innerHeight,
    })
  }

  const plateTimeline = engine.gsap.timeline({
    scrollTrigger: {
      trigger: plate,
      start: () => measurePlateRange().start,
      end: () => measurePlateRange().end,
      refreshPriority: 1,
      scrub: 0.7,
    },
  })
  plateTimeline.fromTo(
    plate,
    { clipPath: 'inset(0 0 100%)' },
    { clipPath: 'inset(0 0 0%)', ease: 'none' },
    0,
  )
  plateTimeline.fromTo(image, { yPercent: -4 }, { ease: 'none', yPercent: 4 }, 0)

  const ghostTimeline = engine.gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: () => measureSectionRange().start,
      end: () => measureSectionRange().end,
      refreshPriority: 1,
      scrub: 0.8,
    },
  })
  ghostTimeline.fromTo(ghost, { y: 28 }, { ease: 'none', y: -28 }, 0)

  const pin = engine.isCoarsePointer || runtimeWindow.innerWidth <= 720
    ? null
    : engine.ScrollTrigger.create({
        trigger: panel,
        start: 'top top+=88',
        end: () => `+=${Math.max(
          1,
          copy
            ? copy.offsetTop - heading.offsetTop - heading.offsetHeight - 24
            : panel.offsetHeight - heading.offsetHeight - 120,
        )}`,
        invalidateOnRefresh: true,
        pin: heading,
        pinSpacing: false,
        refreshPriority: -1,
      })

  return () => {
    pin?.kill()
    plateTimeline.kill()
    ghostTimeline.kill()
  }
}
