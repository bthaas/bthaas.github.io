import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BOOT_LOADER_ATTRIBUTE,
  BOOT_LOADER_COMPLETE_EVENT,
  BOOT_LOADER_CONFIG,
  BOOT_LOADER_READY_EVENT,
  afterBootLoader,
  announceBootReady,
  getBootLoaderScript,
  isBootLoaderActive,
  runBootLoader,
  type BootLoaderConfig,
} from './boot-loader'
import { GATEWAY_CATEGORIES } from './portfolio-gateway'
import { GATEWAY_ENTRANCE_STORAGE_KEY } from './portfolio-gateway-entrance'

class FakeImage {
  static instances: FakeImage[] = []
  onerror: (() => void) | null = null
  onload: (() => void) | null = null
  src = ''

  constructor() {
    FakeImage.instances.push(this)
  }
}

const config: BootLoaderConfig = {
  ...BOOT_LOADER_CONFIG,
  assets: ['/first.avif', '/second.avif'],
}

let reducedMotion = false

function runScript(overrides: Partial<BootLoaderConfig> = {}) {
  runBootLoader({ ...config, ...overrides })
}

function phase() {
  return document.documentElement.getAttribute(BOOT_LOADER_ATTRIBUTE)
}

function shownPercent() {
  return document.querySelector('[data-boot-loader-value]')?.textContent
}

function loadAllAssets() {
  FakeImage.instances.forEach((image) => image.onload?.())
}

describe('boot loader script', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
      ],
    })
    FakeImage.instances = []
    reducedMotion = false
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }))
    sessionStorage.clear()
    document.documentElement.removeAttribute(BOOT_LOADER_ATTRIBUTE)
    document.body.innerHTML = `
      <span data-boot-loader-value>000</span>
      <span data-boot-loader-fill></span>
    `
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.documentElement.removeAttribute(BOOT_LOADER_ATTRIBUTE)
  })

  it('serializes a self-contained script and escapes markup-breaking characters', () => {
    const script = getBootLoaderScript({ ...config, assets: ['/</script><b>.avif'] })

    expect(script).not.toContain('</script>')
    expect(script).toContain('\\u003c/script>')
  })

  it('tracks the gateway imagery and shares the entrance storage key by default', () => {
    expect(BOOT_LOADER_CONFIG.assets).toEqual(GATEWAY_CATEGORIES.map(({ image }) => image))
    expect(BOOT_LOADER_CONFIG.storageKey).toBe(GATEWAY_ENTRANCE_STORAGE_KEY)
  })

  it('runs standalone from its serialized inline form', () => {
    new Function(getBootLoaderScript(config))()

    expect(phase()).toBe('loading')
    expect(FakeImage.instances).toHaveLength(config.assets.length)
  })

  it('covers the first unseen home visit before any frame paints', () => {
    runScript()

    expect(phase()).toBe('loading')
    expect(FakeImage.instances.map((image) => image.src)).toEqual(config.assets)
  })

  it('stays out of the way for prior visits, reduced motion, other routes, and blocked storage', () => {
    sessionStorage.setItem(GATEWAY_ENTRANCE_STORAGE_KEY, '1')
    runScript()
    expect(phase()).toBeNull()

    sessionStorage.clear()
    reducedMotion = true
    runScript()
    expect(phase()).toBeNull()

    reducedMotion = false
    runScript({ paths: ['/projects'] })
    expect(phase()).toBeNull()

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    runScript()
    expect(phase()).toBeNull()
    expect(FakeImage.instances).toHaveLength(0)
  })

  it('holds short of complete until the app reports the gateway is staged', () => {
    runScript()
    loadAllAssets()
    vi.advanceTimersByTime(4000)

    expect(phase()).toBe('loading')
    expect(Number(shownPercent())).toBeGreaterThan(60)
    expect(Number(shownPercent())).toBeLessThan(100)
  })

  it('fills to 100, holds, then reveals the page and clears itself', () => {
    const complete = vi.fn()
    window.addEventListener(BOOT_LOADER_COMPLETE_EVENT, complete)
    runScript()
    loadAllAssets()
    window.dispatchEvent(new Event(BOOT_LOADER_READY_EVENT))

    vi.advanceTimersByTime(config.minimumMs - 100)
    expect(phase()).toBe('loading')
    expect(Number(shownPercent())).toBeLessThan(100)

    vi.advanceTimersByTime(1000)
    expect(shownPercent()).toBe('100')
    expect(document.querySelector<HTMLElement>('[data-boot-loader-fill]')?.style.transform)
      .toBe('scaleX(1)')
    expect(phase()).toBe('exiting')
    expect(complete).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(config.exitMs)
    expect(phase()).toBeNull()
    window.removeEventListener(BOOT_LOADER_COMPLETE_EVENT, complete)
  })

  it('counts failed or decoded images once and never moves backwards', () => {
    const decode = vi.fn(() => Promise.resolve())
    Object.assign(FakeImage.prototype, { decode })
    runScript()
    FakeImage.instances[0]?.onerror?.()
    FakeImage.instances[0]?.onload?.()

    const samples: number[] = []
    for (let frame = 0; frame < 40; frame += 1) {
      vi.advanceTimersByTime(50)
      samples.push(Number(shownPercent()))
    }

    expect(decode).toHaveBeenCalledTimes(2)
    expect(samples).toEqual([...samples].sort((left, right) => left - right))
    expect(phase()).toBe('loading')
    Reflect.deleteProperty(FakeImage.prototype, 'decode')
  })

  it('gives up waiting after the window load grace period', () => {
    runScript()
    window.dispatchEvent(new Event('load'))
    vi.advanceTimersByTime(config.loadGraceMs - 1)
    expect(phase()).toBe('loading')

    vi.advanceTimersByTime(config.holdMs + 1000)
    expect(phase()).toBe('exiting')
  })

  it('gives up waiting after the absolute timeout', () => {
    runScript()
    vi.advanceTimersByTime(config.timeoutMs - 1)
    expect(phase()).toBe('loading')

    vi.advanceTimersByTime(config.holdMs + 1000)
    expect(phase()).toBe('exiting')
  })
})

describe('boot loader app hooks', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(BOOT_LOADER_ATTRIBUTE)
  })

  it('runs immediately when no loader covers the page', () => {
    const callback = vi.fn()

    expect(isBootLoaderActive()).toBe(false)
    afterBootLoader(callback)()
    expect(callback).toHaveBeenCalledOnce()
  })

  it('waits for the loader to start revealing the page', () => {
    document.documentElement.setAttribute(BOOT_LOADER_ATTRIBUTE, 'loading')
    const callback = vi.fn()

    expect(isBootLoaderActive()).toBe(true)
    afterBootLoader(callback)
    expect(callback).not.toHaveBeenCalled()

    window.dispatchEvent(new Event(BOOT_LOADER_COMPLETE_EVENT))
    window.dispatchEvent(new Event(BOOT_LOADER_COMPLETE_EVENT))
    expect(callback).toHaveBeenCalledOnce()
  })

  it('stops waiting when the caller is cleaned up', () => {
    document.documentElement.setAttribute(BOOT_LOADER_ATTRIBUTE, 'loading')
    const callback = vi.fn()

    afterBootLoader(callback)()
    window.dispatchEvent(new Event(BOOT_LOADER_COMPLETE_EVENT))
    expect(callback).not.toHaveBeenCalled()
  })

  it('announces that the app has staged the gateway', () => {
    const ready = vi.fn()
    window.addEventListener(BOOT_LOADER_READY_EVENT, ready)

    announceBootReady()

    expect(ready).toHaveBeenCalledOnce()
    window.removeEventListener(BOOT_LOADER_READY_EVENT, ready)
  })
})
