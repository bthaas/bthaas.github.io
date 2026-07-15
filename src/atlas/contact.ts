import {
  getContactCharacterOffsetEm,
  getContactDocumentProgress,
  getContactGlowProgress,
  getContactScrollProgress,
  getContactWordRevealProgress,
} from '../../lib/atlas-motion/contact-choreography'

import { splitText } from './split-text'
import { SUN_PROGRESS_EVENT, type SunProgressDetail } from './sun-arc'

interface ContactMetrics {
  elementHeight: number
  elementTop: number
}

type ContactResizeObserver = Pick<ResizeObserver, 'disconnect' | 'observe'>
type ResizeObserverFactory = (callback: () => void) => ContactResizeObserver | undefined

function prepareContactTitle(title: HTMLElement) {
  splitText(title, 'word')
  const words = Array.from(
    title.querySelectorAll<HTMLElement>(':scope > .atlas-split-mask > .atlas-split-token'),
  )

  words.forEach((word) => {
    word.dataset.contactWord = ''
    splitText(word, 'character')
  })

  return {
    characters: Array.from(
      title.querySelectorAll<HTMLElement>(
        '.atlas-split-mask--character > .atlas-split-token',
      ),
    ),
    words,
  }
}

export function setupContactFinale(
  root: Document = document,
  runtimeWindow: Window = window,
  createResizeObserver: ResizeObserverFactory = (callback) => {
    const ResizeObserverConstructor = root.defaultView?.ResizeObserver
    return ResizeObserverConstructor
      ? new ResizeObserverConstructor(() => callback())
      : undefined
  },
): () => void {
  const section = root.querySelector<HTMLElement>('[data-contact-finale]')
  const title = section?.querySelector<HTMLElement>('[data-contact-title]')
  if (!section || !title) return () => undefined

  const { characters, words } = prepareContactTitle(title)
  const metrics: ContactMetrics = { elementHeight: 0, elementTop: 0 }
  let latestScrollY = runtimeWindow.scrollY
  let latestDocumentProgress = 0
  let latestSunProgress = 0
  let measuredOnApproach = false
  let firstMeasureFrame = 0
  let secondMeasureFrame = 0

  const measure = () => {
    const bounds = section.getBoundingClientRect()
    metrics.elementHeight = bounds.height
    metrics.elementTop = bounds.top + runtimeWindow.scrollY
  }
  const render = () => {
    const measuredProgress = getContactScrollProgress({
      ...metrics,
      scrollY: latestScrollY,
      viewportHeight: runtimeWindow.innerHeight,
    })
    const progress = Math.max(
      measuredProgress,
      getContactDocumentProgress(latestDocumentProgress),
    )
    const glow = getContactGlowProgress(progress, latestSunProgress)

    section.style.setProperty('--atlas-contact-glow', String(glow))
    section.style.setProperty(
      '--atlas-contact-email-reveal',
      String(getContactWordRevealProgress(progress, 2)),
    )
    words.forEach((word, index) => {
      word.style.setProperty(
        '--atlas-contact-word-reveal',
        String(getContactWordRevealProgress(progress, index)),
      )
    })
    characters.forEach((character, index) => {
      const offset = getContactCharacterOffsetEm(index, characters.length, progress)
      character.style.setProperty('--atlas-contact-character-x', `${offset}em`)
    })
  }
  const handleScroll = (event: Event) => {
    const { detail } = event as CustomEvent<{
      documentProgress?: number
      scrollY?: number
    }>
    latestScrollY = detail?.scrollY ?? runtimeWindow.scrollY
    latestDocumentProgress = detail?.documentProgress ?? latestDocumentProgress
    if (
      !measuredOnApproach &&
      latestScrollY >= metrics.elementTop - runtimeWindow.innerHeight * 1.5
    ) {
      measuredOnApproach = true
      measure()
    }
    render()
  }
  const handleSunProgress = (event: Event) => {
    const { detail } = event as CustomEvent<SunProgressDetail>
    latestSunProgress = detail?.progress ?? latestSunProgress
    render()
  }
  const handleResize = () => {
    measure()
    latestScrollY = runtimeWindow.scrollY
    render()
  }
  const handleLoad = () => handleResize()
  const resizeObserver = createResizeObserver(handleResize)

  section.dataset.contactReady = ''
  measure()
  render()
  resizeObserver?.observe(section)
  runtimeWindow.addEventListener('atlas:scroll', handleScroll)
  runtimeWindow.addEventListener(SUN_PROGRESS_EVENT, handleSunProgress)
  runtimeWindow.addEventListener('resize', handleResize, { passive: true })
  if (root.readyState !== 'complete') {
    runtimeWindow.addEventListener('load', handleLoad, { once: true })
  }
  firstMeasureFrame = runtimeWindow.requestAnimationFrame(() => {
    firstMeasureFrame = 0
    secondMeasureFrame = runtimeWindow.requestAnimationFrame(() => {
      secondMeasureFrame = 0
      handleResize()
    })
  })

  return () => {
    runtimeWindow.cancelAnimationFrame(firstMeasureFrame)
    runtimeWindow.cancelAnimationFrame(secondMeasureFrame)
    resizeObserver?.disconnect()
    runtimeWindow.removeEventListener('atlas:scroll', handleScroll)
    runtimeWindow.removeEventListener(SUN_PROGRESS_EVENT, handleSunProgress)
    runtimeWindow.removeEventListener('resize', handleResize)
    runtimeWindow.removeEventListener('load', handleLoad)
    section.style.removeProperty('--atlas-contact-glow')
    section.style.removeProperty('--atlas-contact-email-reveal')
    delete section.dataset.contactReady
    words.forEach((word) => word.style.removeProperty('--atlas-contact-word-reveal'))
    characters.forEach((character) => {
      character.style.removeProperty('--atlas-contact-character-x')
    })
  }
}
