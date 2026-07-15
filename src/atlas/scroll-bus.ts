import { getDocumentProgress } from '../../lib/atlas-motion/progress'

export interface ScrollSnapshot {
  readonly documentProgress: number
  readonly scrollY: number
}

export type ScrollSubscriber = (snapshot: ScrollSnapshot) => void

export interface ScrollBus {
  readonly destroy: () => void
  readonly subscribe: (subscriber: ScrollSubscriber) => () => void
}

export function createScrollBus(): ScrollBus {
  const subscribers = new Set<ScrollSubscriber>()
  let animationFrame = 0
  let isQueued = false

  const publish = () => {
    isQueued = false
    const snapshot = {
      documentProgress: getDocumentProgress({
        scrollHeight: document.documentElement.scrollHeight,
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
      }),
      scrollY: window.scrollY,
    }
    subscribers.forEach((subscriber) => subscriber(snapshot))
  }

  const queuePublish = () => {
    if (isQueued) return
    isQueued = true
    animationFrame = requestAnimationFrame(publish)
  }

  window.addEventListener('scroll', queuePublish, { passive: true })
  window.addEventListener('resize', queuePublish, { passive: true })
  queuePublish()

  return {
    destroy: () => {
      window.removeEventListener('scroll', queuePublish)
      window.removeEventListener('resize', queuePublish)
      cancelAnimationFrame(animationFrame)
      subscribers.clear()
    },
    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      return () => subscribers.delete(subscriber)
    },
  }
}
