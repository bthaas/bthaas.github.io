export type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => IntersectionObserver

export function setupChapterWipes(
  root: Document = document,
  supportsScrollDriven =
    typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()'),
  createObserver: ObserverFactory | undefined =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : (callback, options) => new IntersectionObserver(callback, options),
): () => void {
  const chapters = Array.from(root.querySelectorAll<HTMLElement>('[data-chapter-wipe]'))
  if (supportsScrollDriven || chapters.length === 0 || !createObserver) return () => undefined

  const observer = createObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-chapter-visible')
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  )

  root.documentElement.classList.add('atlas-chapter-wipe-fallback')
  chapters.forEach((chapter) => observer.observe(chapter))

  return () => {
    observer.disconnect()
    root.documentElement.classList.remove('atlas-chapter-wipe-fallback')
    chapters.forEach((chapter) => chapter.classList.remove('is-chapter-visible'))
  }
}
