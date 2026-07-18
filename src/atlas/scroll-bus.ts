import { getDocumentProgress } from '../../lib/atlas-motion/progress'
import { getAtlasEngine, type AtlasEngine } from './engine'

export interface ScrollSnapshot {
  readonly documentProgress: number
  readonly scrollY: number
  readonly velocity: number
}

export type ScrollSubscriber = (snapshot: ScrollSnapshot) => void

export interface ScrollBus {
  readonly destroy: () => void
  readonly subscribe: (subscriber: ScrollSubscriber) => () => void
}

interface ScrollBusOptions {
  readonly document?: Document
  readonly engine?: AtlasEngine | null
  readonly window?: Window
}

export function createScrollBus({
  document: runtimeDocument = document,
  engine = getAtlasEngine(),
  window: runtimeWindow = window,
}: ScrollBusOptions = {}): ScrollBus {
  const subscribers = new Set<ScrollSubscriber>()
  let lastPublished: ScrollSnapshot | null = null

  const readSnapshot = (scrollYOverride?: number): ScrollSnapshot => {
    const scrollY = scrollYOverride ?? engine?.lenis.scroll ?? runtimeWindow.scrollY
    return {
      documentProgress: getDocumentProgress({
        scrollHeight: runtimeDocument.documentElement.scrollHeight,
        scrollY,
        viewportHeight: runtimeWindow.innerHeight,
      }),
      scrollY,
      velocity: engine?.lenis.velocity ?? 0,
    }
  }

  const publish = (scrollYOverride?: number) => {
    const snapshot = readSnapshot(scrollYOverride)
    if (
      lastPublished?.scrollY === snapshot.scrollY &&
      lastPublished.documentProgress === snapshot.documentProgress &&
      lastPublished.velocity === snapshot.velocity
    ) return
    lastPublished = snapshot
    subscribers.forEach((subscriber) => subscriber(snapshot))
  }
  const handleNativeScroll = () => {
    publish(runtimeWindow.scrollY)
  }

  const trigger = engine?.ScrollTrigger.create({
    end: 'max',
    onRefresh: () => publish(),
    onUpdate: () => publish(),
    start: 0,
    trigger: runtimeDocument.documentElement,
  })
  runtimeWindow.addEventListener('scroll', handleNativeScroll, { passive: true })

  return {
    destroy: () => {
      trigger?.kill()
      runtimeWindow.removeEventListener('scroll', handleNativeScroll)
      subscribers.clear()
      lastPublished = null
    },
    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      subscriber(readSnapshot())
      return () => subscribers.delete(subscriber)
    },
  }
}
