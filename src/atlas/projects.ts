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

interface ProjectPanelPair {
  readonly detail: HTMLElement
  readonly detailWasHidden: boolean
  readonly expandedValue: string | null
  readonly trigger: HTMLAnchorElement
}

export function setupProjectPanels(root: Document = document): () => void {
  const pairs: ProjectPanelPair[] = Array.from(
    root.querySelectorAll<HTMLAnchorElement>('[data-project-trigger]'),
  ).flatMap((trigger) => {
    const detailId = trigger.getAttribute('aria-controls')
    const detail = detailId ? root.getElementById(detailId) : null
    if (!detail?.matches('[data-project-detail]')) return []

    return [{
      detail,
      detailWasHidden: detail.hidden,
      expandedValue: trigger.getAttribute('aria-expanded'),
      trigger,
    }]
  })
  if (pairs.length === 0) return () => undefined

  let openIndex: number | null = null

  const setOpenIndex = (nextIndex: number | null) => {
    openIndex = nextIndex
    pairs.forEach(({ detail, trigger }, index) => {
      const isOpen = index === nextIndex
      detail.hidden = !isOpen
      detail.classList.toggle('is-project-open', isOpen)
      trigger.classList.toggle('is-project-selected', isOpen)
      trigger.setAttribute('aria-expanded', String(isOpen))
    })
  }
  const cleanups = pairs.map(({ trigger }, index) => {
    const handleClick = (event: MouseEvent) => {
      event.preventDefault()
      setOpenIndex(openIndex === index ? null : index)
    }
    trigger.addEventListener('click', handleClick)
    return () => trigger.removeEventListener('click', handleClick)
  })
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || openIndex === null) return
    const activeTrigger = pairs[openIndex].trigger
    setOpenIndex(null)
    activeTrigger.focus()
  }

  root.documentElement.classList.add('atlas-project-panels-ready')
  root.addEventListener('keydown', handleKeyDown)
  setOpenIndex(null)

  return () => {
    cleanups.forEach((cleanup) => cleanup())
    root.removeEventListener('keydown', handleKeyDown)
    root.documentElement.classList.remove('atlas-project-panels-ready')
    pairs.forEach(({ detail, detailWasHidden, expandedValue, trigger }) => {
      detail.hidden = detailWasHidden
      detail.classList.remove('is-project-open')
      trigger.classList.remove('is-project-selected')
      if (expandedValue === null) trigger.removeAttribute('aria-expanded')
      else trigger.setAttribute('aria-expanded', expandedValue)
    })
  }
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
