import {
  getCraftMotion,
  getCraftViewProgress,
} from '../../lib/atlas-motion/craft-choreography'

export function setupCraftChapter(
  root: Document = document,
  runtimeWindow: Window = window,
  supportsScrollDriven =
    typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()'),
): () => void {
  const section = root.querySelector<HTMLElement>('.craft-section')
  const plate = root.querySelector<HTMLElement>('.craft-art')
  if (supportsScrollDriven || !section || !plate) return () => undefined

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
  root.documentElement.classList.add('atlas-craft-fallback')
  measure()
  render(runtimeWindow.scrollY)
  runtimeWindow.addEventListener('atlas:scroll', handleScroll)
  runtimeWindow.addEventListener('resize', handleResize, { passive: true })

  return () => {
    runtimeWindow.removeEventListener('atlas:scroll', handleScroll)
    runtimeWindow.removeEventListener('resize', handleResize)
    root.documentElement.classList.remove('atlas-craft-fallback')
    section.style.removeProperty('--atlas-craft-ghost-y')
    plate.style.removeProperty('--atlas-craft-clip-bottom')
    plate.style.removeProperty('--atlas-craft-image-y')
  }
}
