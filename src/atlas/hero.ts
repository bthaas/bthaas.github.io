import {
  getEntranceTimeline,
  getHeroExitProgress,
  getHeroParallax,
} from '../../lib/atlas-motion/hero-choreography'

import { countUp, type CountUpOptions } from './count-up'
import { splitText } from './split-text'

const ENTRANCE_STORAGE_KEY = 'atlas-entered'
const METRIC_DURATION_MS = 900
const SOURCE_STAGGER_MS = 70

type EntranceStorage = Pick<Storage, 'getItem' | 'setItem'>
type MetricAnimator = (
  element: HTMLElement,
  target: string,
  options?: CountUpOptions,
) => () => void
type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => IntersectionObserver

function readEntered(storage: EntranceStorage): boolean {
  try {
    return storage.getItem(ENTRANCE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function rememberEntrance(storage: EntranceStorage): void {
  try {
    storage.setItem(ENTRANCE_STORAGE_KEY, '1')
  } catch {
    // A blocked storage API should not block the entrance or the page.
  }
}

export function setupEntrance(
  root: Document = document,
  storage: EntranceStorage = sessionStorage,
): () => void {
  const html = root.documentElement
  if (readEntered(storage)) {
    html.classList.add('atlas-entered')
    return () => undefined
  }

  const masthead = root.querySelector<HTMLElement>('[data-atlas-masthead]')
  if (masthead) splitText(masthead, 'character')
  const characterCount = masthead?.querySelectorAll('.atlas-split-token').length ?? 0
  const timeline = getEntranceTimeline(characterCount)

  html.style.setProperty('--atlas-entrance-plate-duration', `${timeline.plate.durationMs}ms`)
  html.style.setProperty('--atlas-entrance-grain-delay', `${timeline.grain.startMs}ms`)
  html.style.setProperty('--atlas-entrance-grain-duration', `${timeline.grain.durationMs}ms`)
  html.style.setProperty('--atlas-entrance-masthead-start', `${timeline.mastheadStartMs}ms`)
  html.style.setProperty('--atlas-entrance-character-duration', `${timeline.characterDurationMs}ms`)
  html.style.setProperty('--atlas-entrance-character-stagger', `${timeline.characterStaggerMs}ms`)
  html.style.setProperty('--atlas-entrance-chrome-start', `${timeline.chrome.startMs}ms`)
  html.style.setProperty('--atlas-entrance-chrome-duration', `${timeline.chrome.durationMs}ms`)
  html.classList.remove('atlas-entered')
  html.classList.add('atlas-entering')
  rememberEntrance(storage)

  const timer = window.setTimeout(() => {
    html.classList.remove('atlas-entering')
    html.classList.add('atlas-entered')
  }, timeline.totalMs)

  return () => {
    window.clearTimeout(timer)
    html.classList.remove('atlas-entering')
  }
}

export function setupMetricCountUps(
  root: Document = document,
  createObserver: ObserverFactory | undefined =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : (callback, options) => new IntersectionObserver(callback, options),
  animate: MetricAnimator = countUp,
): () => void {
  const strip = root.querySelector<HTMLElement>('.signal-strip')
  const metrics = Array.from(root.querySelectorAll<HTMLElement>('[data-atlas-count]'))
  if (!strip || metrics.length === 0 || !createObserver) return () => undefined

  strip.dataset.atlasCountReady = ''
  strip.querySelectorAll<HTMLElement>('small').forEach((source, index) => {
    source.style.setProperty('--atlas-source-delay', `${index * SOURCE_STAGGER_MS}ms`)
  })

  let completionTimer = 0
  let cancelAnimations: Array<() => void> = []
  const observer = createObserver(
    (entries) => {
      const entry = entries.find(({ target }) => target === strip)
      if (!entry?.isIntersecting) return

      observer.unobserve(strip)
      strip.classList.add('is-counting')
      cancelAnimations = metrics.map((metric) => {
        const target = metric.textContent?.trim() ?? ''
        return animate(metric, target, { durationMs: METRIC_DURATION_MS, steps: 30 })
      })
      completionTimer = window.setTimeout(() => {
        strip.classList.remove('is-counting')
        strip.classList.add('is-counted')
      }, METRIC_DURATION_MS)
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.28 },
  )

  observer.observe(strip)
  return () => {
    observer.disconnect()
    window.clearTimeout(completionTimer)
    cancelAnimations.forEach((cancel) => cancel())
  }
}

export function setupHeroParallax(
  root: Document = document,
  runtimeWindow: Window = window,
  supportsScrollDriven = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()'),
): () => void {
  const hero = root.querySelector<HTMLElement>('.hero-art')
  if (!hero || supportsScrollDriven) return () => undefined

  let elementHeight = 0
  let elementTop = 0
  const measure = () => {
    const bounds = hero.getBoundingClientRect()
    elementHeight = bounds.height
    elementTop = bounds.top + runtimeWindow.scrollY
  }
  const render = (scrollY: number) => {
    const progress = getHeroExitProgress({ elementHeight, elementTop, scrollY })
    const frame = getHeroParallax(progress)
    hero.style.setProperty('--atlas-hero-image-y', `${frame.imageTranslatePercent}%`)
    hero.style.setProperty('--atlas-hero-caption-y', `${frame.captionTranslateVh}vh`)
    hero.style.setProperty('--atlas-hero-scale', String(frame.plateScale))
  }
  const handleScroll = (event: Event) => {
    const { detail } = event as CustomEvent<{ scrollY?: number }>
    render(detail?.scrollY ?? runtimeWindow.scrollY)
  }
  const handleResize = () => {
    measure()
    render(runtimeWindow.scrollY)
  }

  root.documentElement.classList.add('atlas-hero-fallback')
  measure()
  render(runtimeWindow.scrollY)
  runtimeWindow.addEventListener('atlas:scroll', handleScroll)
  runtimeWindow.addEventListener('resize', handleResize, { passive: true })

  return () => {
    runtimeWindow.removeEventListener('atlas:scroll', handleScroll)
    runtimeWindow.removeEventListener('resize', handleResize)
    root.documentElement.classList.remove('atlas-hero-fallback')
    hero.style.removeProperty('--atlas-hero-image-y')
    hero.style.removeProperty('--atlas-hero-caption-y')
    hero.style.removeProperty('--atlas-hero-scale')
  }
}
