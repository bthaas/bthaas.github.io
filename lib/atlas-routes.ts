/** The portfolio screens reachable from the home gateway. */
export const PORTFOLIO_DESTINATIONS = [
  '/experience',
  '/projects',
  '/skills',
  '/contact',
] as const

const PORTFOLIO_SCREEN_PATHS: ReadonlySet<string> = new Set(['/', ...PORTFOLIO_DESTINATIONS])

export function normalizePathname(value: string): string {
  const pathname = value.split(/[?#]/, 1)[0]
  return pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
}

/** Routes that render the shared atlas portfolio shell and its decorative motion layers. */
export function isPortfolioScreenPath(pathname: string): boolean {
  return PORTFOLIO_SCREEN_PATHS.has(normalizePathname(pathname))
}
