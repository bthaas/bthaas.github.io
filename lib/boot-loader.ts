import { GATEWAY_CATEGORIES } from '@/lib/portfolio-gateway'
import { GATEWAY_ENTRANCE_STORAGE_KEY } from '@/lib/portfolio-gateway-entrance'

/** Root attribute that holds the boot loader phase while it covers the page. */
export const BOOT_LOADER_ATTRIBUTE = 'data-atlas-boot'
/** Dispatched by the app once the gateway entrance is staged beneath the loader. */
export const BOOT_LOADER_READY_EVENT = 'atlas:boot-ready'
/** Dispatched by the loader when it starts revealing the page. */
export const BOOT_LOADER_COMPLETE_EVENT = 'atlas:boot-complete'

export type BootLoaderPhase = 'exiting' | 'loading'

export interface BootLoaderConfig {
  readonly assets: readonly string[]
  readonly attribute: string
  readonly completeEvent: string
  readonly creepMs: number
  readonly exitMs: number
  readonly fillSelector: string
  readonly holdMs: number
  readonly loadGraceMs: number
  readonly minimumMs: number
  readonly paths: readonly string[]
  readonly readyEvent: string
  readonly smoothingMs: number
  readonly storageKey: string
  readonly timeoutMs: number
  readonly valueSelector: string
}

export const BOOT_LOADER_CONFIG: BootLoaderConfig = {
  assets: GATEWAY_CATEGORIES.map((category) => category.image),
  attribute: BOOT_LOADER_ATTRIBUTE,
  completeEvent: BOOT_LOADER_COMPLETE_EVENT,
  creepMs: 1800,
  exitMs: 760,
  fillSelector: '[data-boot-loader-fill]',
  holdMs: 220,
  loadGraceMs: 4000,
  minimumMs: 1100,
  paths: ['/', '/index.html'],
  readyEvent: BOOT_LOADER_READY_EVENT,
  smoothingMs: 120,
  storageKey: GATEWAY_ENTRANCE_STORAGE_KEY,
  timeoutMs: 12000,
  valueSelector: '[data-boot-loader-value]',
}

/**
 * Runs inline in <head>, before the server-rendered gateway paints, so the
 * columns never appear at rest before the entrance replays them. It must stay
 * self-contained: it is serialized with Function#toString and receives every
 * value through `config`.
 */
export function runBootLoader(config: BootLoaderConfig): void {
  const root = document.documentElement
  try {
    if (config.paths.indexOf(window.location.pathname) === -1) return
    if (window.sessionStorage.getItem(config.storageKey) === '1') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  } catch {
    return
  }

  const total = config.assets.length + 1
  const startedAt = performance.now()
  let completed = 0
  let progressAt = startedAt
  let lastFrameAt = startedAt
  let shown = 0
  let lastPercent = -1
  let finished = false
  let fill: HTMLElement | null = null
  let value: HTMLElement | null = null

  const track = () => {
    let settled = false
    return () => {
      if (settled || finished) return
      settled = true
      completed += 1
      progressAt = performance.now()
    }
  }
  const forceComplete = () => {
    if (finished) return
    completed = total
    progressAt = performance.now()
  }
  const render = (progress: number) => {
    fill = fill || document.querySelector<HTMLElement>(config.fillSelector)
    value = value || document.querySelector<HTMLElement>(config.valueSelector)
    if (fill) fill.style.transform = 'scaleX(' + Math.round(progress * 10000) / 10000 + ')'
    const percent = Math.round(progress * 100)
    if (value && percent !== lastPercent) {
      lastPercent = percent
      value.textContent = String(percent).padStart(3, '0')
    }
  }
  const exit = () => {
    root.setAttribute(config.attribute, 'exiting')
    window.dispatchEvent(new CustomEvent(config.completeEvent))
    window.setTimeout(() => root.removeAttribute(config.attribute), config.exitMs)
  }
  const frame = (now: number) => {
    const elapsed = now - startedAt
    const creep = completed < total
      ? 0.85 * (1 - Math.exp(-(now - progressAt) / config.creepMs))
      : 0
    const target = Math.min((completed + creep) / total, elapsed / config.minimumMs, 1)
    const blend = 1 - Math.exp(-Math.max(0, now - lastFrameAt) / config.smoothingMs)
    lastFrameAt = now
    shown = Math.max(shown, shown + (target - shown) * blend)
    if (completed >= total && elapsed >= config.minimumMs && 1 - shown < 0.004) shown = 1
    render(shown)
    if (shown < 1) {
      window.requestAnimationFrame(frame)
      return
    }
    finished = true
    window.setTimeout(exit, config.holdMs)
  }

  root.setAttribute(config.attribute, 'loading')
  config.assets.forEach((source) => {
    const done = track()
    const image = new Image()
    image.onload = done
    image.onerror = done
    image.src = source
    if (typeof image.decode === 'function') image.decode().then(done, done)
  })
  window.addEventListener(config.readyEvent, track(), { once: true })
  window.addEventListener('load', () => {
    window.setTimeout(forceComplete, config.loadGraceMs)
  }, { once: true })
  window.setTimeout(forceComplete, config.timeoutMs)
  window.requestAnimationFrame(frame)
}

export function getBootLoaderScript(config: BootLoaderConfig = BOOT_LOADER_CONFIG): string {
  const serializedConfig = JSON.stringify(config).replace(/</g, '\\u003c')
  return `(${runBootLoader.toString()})(${serializedConfig})`
}

export function isBootLoaderActive(): boolean {
  return document.documentElement.getAttribute(BOOT_LOADER_ATTRIBUTE) === 'loading'
}

export function announceBootReady(): void {
  window.dispatchEvent(new Event(BOOT_LOADER_READY_EVENT))
}

/** Runs `callback` once the loader starts revealing the page, or now if none is active. */
export function afterBootLoader(callback: () => void): () => void {
  if (!isBootLoaderActive()) {
    callback()
    return () => undefined
  }

  const handleComplete = () => callback()
  window.addEventListener(BOOT_LOADER_COMPLETE_EVENT, handleComplete, { once: true })
  return () => window.removeEventListener(BOOT_LOADER_COMPLETE_EVENT, handleComplete)
}
