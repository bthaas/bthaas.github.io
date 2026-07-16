const BELLEVUE_TIME_ZONE = 'America/Los_Angeles'

type IntervalScheduler = (callback: () => void, delay: number) => number
type IntervalClearer = (handle: number) => void

export function formatBellevueTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone: BELLEVUE_TIME_ZONE,
  }).formatToParts(date)
  const hour = parts.find(({ type }) => type === 'hour')?.value ?? '00'
  const minute = parts.find(({ type }) => type === 'minute')?.value ?? '00'
  return `${hour}:${minute}`
}

export function setupLocalTime(
  root: Document = document,
  now: () => Date = () => new Date(),
  schedule: IntervalScheduler = (callback, delay) => window.setInterval(callback, delay),
  clear: IntervalClearer = (handle) => window.clearInterval(handle),
): () => void {
  const clock = root.querySelector<HTMLElement>('[data-atlas-local-time]')
  if (!clock) return () => undefined

  const render = () => {
    clock.textContent = `Bellevue, WA — ${formatBellevueTime(now())}`
  }
  render()
  const interval = schedule(render, 60_000)
  return () => clear(interval)
}
