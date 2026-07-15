export type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => IntersectionObserver

const STAGGER_DELAY_MS = 80

export function setupReveals(
  root: Document = document,
  createObserver: ObserverFactory | undefined =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : (callback, options) => new IntersectionObserver(callback, options),
): () => void {
  if (!createObserver) return () => undefined

  const targets = new Set<HTMLElement>()
  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((target) => targets.add(target))
  root.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) return
      child.style.setProperty('--atlas-reveal-delay', `${index * STAGGER_DELAY_MS}ms`)
      targets.add(child)
    })
  })

  if (targets.size === 0) return () => undefined

  const observer = createObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  )

  document.documentElement.classList.add('atlas-reveal-ready')
  targets.forEach((target) => observer.observe(target))

  return () => {
    observer.disconnect()
    document.documentElement.classList.remove('atlas-reveal-ready')
  }
}
