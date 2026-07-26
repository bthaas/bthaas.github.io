import { Portfolio, type PortfolioScreenName } from './Portfolio'

export type { PortfolioScreenName }

export function PortfolioScreen({
  screen,
}: {
  readonly screen: PortfolioScreenName
}) {
  return <Portfolio screen={screen} />
}
