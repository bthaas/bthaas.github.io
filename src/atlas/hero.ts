import { formatCountUpFrame } from '../../lib/atlas-motion/count-up'

import { getAtlasEngine, type AtlasEngine } from './engine'

const ENTRANCE_STORAGE_KEY = 'atlas-entered'

type EntranceStorage = Pick<Storage, 'getItem' | 'setItem'>

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
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const html = root.documentElement
  if (readEntered(storage) || !engine) {
    html.classList.add('atlas-entered')
    return () => undefined
  }

  const masthead = root.querySelector<HTMLElement>('[data-atlas-masthead]')
  if (!masthead) {
    html.classList.add('atlas-entered')
    return () => undefined
  }

  const split = engine.plugins.SplitText.create(masthead, {
    aria: 'auto',
    mask: 'lines',
    type: 'chars',
  })
  const heroArt = root.querySelector<HTMLElement>('.hero-art')
  const chrome = Array.from(root.querySelectorAll<HTMLElement>('.site-nav, .hero-meta'))
  html.classList.remove('atlas-entered')
  html.classList.add('atlas-entering')
  rememberEntrance(storage)

  const timeline = engine.gsap.timeline({
    onComplete: () => {
      html.classList.remove('atlas-entering')
      html.classList.add('atlas-entered')
    },
  })
  if (heroArt) {
    timeline.fromTo(
      heroArt,
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 0.46, ease: 'power3.out' },
      0,
    )
  }
  timeline.fromTo(
    split.chars,
    { opacity: 0, yPercent: 110 },
    { duration: 0.36, ease: 'power3.out', opacity: 1, stagger: 0.06, yPercent: 0 },
    0.36,
  )
  if (chrome.length > 0) {
    timeline.fromTo(
      chrome,
      { opacity: 0, y: 8 },
      { duration: 0.38, ease: 'power2.out', opacity: 1, stagger: 0.05, y: 0 },
      0.62,
    )
  }

  return () => {
    timeline.kill()
    split.revert()
    html.classList.remove('atlas-entering')
  }
}

export function setupMetricCountUps(
  root: Document = document,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const strip = root.querySelector<HTMLElement>('.signal-strip')
  const metrics = Array.from(root.querySelectorAll<HTMLElement>('[data-atlas-count]'))
  if (!strip || metrics.length === 0 || !engine) return () => undefined

  strip.dataset.atlasCountReady = ''
  const sources = Array.from(strip.querySelectorAll<HTMLElement>('small'))
  engine.gsap.set(sources, { opacity: 0, y: 5 })
  const tweens: Array<{ kill: () => void }> = []
  let completed = 0
  const trigger = engine.ScrollTrigger.create({
    trigger: strip,
    start: 'top 72%',
    once: true,
    onEnter: () => {
      strip.classList.add('is-counting')
      metrics.forEach((metric) => {
        const target = metric.textContent?.trim() ?? ''
        const counter = { progress: 0 }
        engine.gsap.set(metric, { filter: 'blur(0.75px)' })
        const tween = engine.gsap.to(counter, {
          duration: 0.9,
          ease: 'power2.out',
          progress: 1,
          snap: { progress: 1 / 30 },
          onUpdate: () => {
            metric.textContent = formatCountUpFrame(target, counter.progress)
          },
          onComplete: () => {
            metric.textContent = target
            tweens.push(engine.gsap.to(metric, {
              duration: 0.08,
              ease: 'power1.out',
              filter: 'blur(0px)',
            }))
            completed += 1
            if (completed !== metrics.length) return
            strip.classList.remove('is-counting')
            strip.classList.add('is-counted')
            tweens.push(engine.gsap.to(sources, {
              duration: 0.32,
              ease: 'power2.out',
              opacity: 1,
              stagger: 0.07,
              y: 0,
            }))
          },
        })
        tweens.push(tween)
      })
    },
  })

  return () => {
    trigger.kill()
    tweens.forEach((tween) => tween.kill())
  }
}

export function setupHeroParallax(
  root: Document = document,
  _runtimeWindow: Window = window,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const hero = root.querySelector<HTMLElement>('.hero-art')
  const picture = hero?.querySelector<HTMLElement>('.atlas-picture--hero')
  const image = picture?.querySelector<HTMLImageElement>('img')
  const caption = hero?.querySelector<HTMLElement>('.art-caption')
  if (!hero || !picture || !image || !caption || !engine) return () => undefined

  const timeline = engine.gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top+=58',
      end: 'bottom top',
      scrub: 0.65,
    },
  })
  timeline.fromTo(picture, { scale: 1.05 }, { ease: 'none', scale: 1 }, 0)
  timeline.fromTo(image, { yPercent: 0 }, { ease: 'none', yPercent: 10.7 }, 0)
  timeline.fromTo(caption, { y: '0vh' }, { ease: 'none', y: '-2.5vh' }, 0)

  return () => {
    timeline.kill()
  }
}
