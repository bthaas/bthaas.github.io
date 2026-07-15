import {
  getCraftMotion,
  getCraftViewProgress,
} from '../../lib/atlas-motion/craft-choreography'

type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => IntersectionObserver

export function setupCraftChapter(
  root: Document = document,
  runtimeWindow: Window = window,
  supportsScrollDriven =
    typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()'),
  createObserver: ObserverFactory | undefined =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : (callback, options) => new IntersectionObserver(callback, options),
): () => void {
  const section = root.querySelector<HTMLElement>('.craft-section')
  const plate = root.querySelector<HTMLElement>('.craft-art')
  if (supportsScrollDriven || !section || !plate || !createObserver) return () => undefined

  let elementHeight = 0
  let elementTop = 0
  const measure = () => {
    const bounds = plate.getBoundingClientRect()
    elementHeight = bounds.height
    elementTop = bounds.top + runtimeWindow.scrollY
  }
  const render = (scrollY: number) => {
    const progress = getCraftViewProgress({
      elementHeight,
      elementTop,
      scrollY,
      viewportHeight: runtimeWindow.innerHeight,
    })
    const frame = getCraftMotion(progress)
    plate.style.setProperty('--atlas-craft-clip-bottom', `${frame.clipBottomPercent}%`)
    plate.style.setProperty('--atlas-craft-image-y', `${frame.imageTranslatePercent}%`)
    section.style.setProperty('--atlas-craft-ghost-y', `${frame.ghostTranslatePixels}px`)
  }
  const handleScroll = (event: Event) => {
    const { detail } = event as CustomEvent<{ scrollY?: number }>
    render(detail?.scrollY ?? runtimeWindow.scrollY)
  }
  const handleResize = () => {
    measure()
    render(runtimeWindow.scrollY)
  }
  const observer = createObserver(
    (entries) => {
      const entry = entries.find(({ target }) => target === section)
      if (!entry?.isIntersecting) return
      section.classList.add('is-craft-visible')
      observer.unobserve(section)
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  )

  root.documentElement.classList.add('atlas-craft-fallback')
  observer.observe(section)
  measure()
  render(runtimeWindow.scrollY)
  runtimeWindow.addEventListener('atlas:scroll', handleScroll)
  runtimeWindow.addEventListener('resize', handleResize, { passive: true })

  return () => {
    observer.disconnect()
    runtimeWindow.removeEventListener('atlas:scroll', handleScroll)
    runtimeWindow.removeEventListener('resize', handleResize)
    root.documentElement.classList.remove('atlas-craft-fallback')
    section.classList.remove('is-craft-visible')
    section.style.removeProperty('--atlas-craft-ghost-y')
    plate.style.removeProperty('--atlas-craft-clip-bottom')
    plate.style.removeProperty('--atlas-craft-image-y')
  }
}
