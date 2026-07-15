import {
  getProjectPan,
  getProjectViewProgress,
} from '../../lib/atlas-motion/project-choreography'

interface ProjectPlateMetrics {
  readonly element: HTMLElement
  readonly index: number
  elementHeight: number
  elementTop: number
}

export function setupProjectPans(
  root: Document = document,
  runtimeWindow: Window = window,
  supportsScrollDriven =
    typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()'),
): () => void {
  const plates: ProjectPlateMetrics[] = Array.from(
    root.querySelectorAll<HTMLElement>('[data-project-pan]'),
    (element, index) => ({
      element,
      index: Number(element.dataset.projectPanIndex ?? index),
      elementHeight: 0,
      elementTop: 0,
    }),
  )
  if (supportsScrollDriven || plates.length === 0) return () => undefined

  const measure = () => {
    plates.forEach((plate) => {
      const bounds = plate.element.getBoundingClientRect()
      plate.elementHeight = bounds.height
      plate.elementTop = bounds.top + runtimeWindow.scrollY
    })
  }
  const render = (scrollY: number) => {
    plates.forEach((plate) => {
      const progress = getProjectViewProgress({
        elementHeight: plate.elementHeight,
        elementTop: plate.elementTop,
        scrollY,
        viewportHeight: runtimeWindow.innerHeight,
      })
      plate.element.style.setProperty(
        '--atlas-project-pan-x',
        `${getProjectPan(progress, plate.index)}%`,
      )
    })
  }
  const handleScroll = (event: Event) => {
    const { detail } = event as CustomEvent<{ scrollY?: number }>
    render(detail?.scrollY ?? runtimeWindow.scrollY)
  }
  const handleResize = () => {
    measure()
    render(runtimeWindow.scrollY)
  }

  root.documentElement.classList.add('atlas-project-fallback')
  measure()
  render(runtimeWindow.scrollY)
  runtimeWindow.addEventListener('atlas:scroll', handleScroll)
  runtimeWindow.addEventListener('resize', handleResize, { passive: true })

  return () => {
    runtimeWindow.removeEventListener('atlas:scroll', handleScroll)
    runtimeWindow.removeEventListener('resize', handleResize)
    root.documentElement.classList.remove('atlas-project-fallback')
    plates.forEach(({ element }) => element.style.removeProperty('--atlas-project-pan-x'))
  }
}
