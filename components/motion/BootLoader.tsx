/**
 * Static loading screen for the first gateway visit. The inline boot script in
 * the root layout decides whether it shows and drives the bar before React
 * hydrates, so the mutated nodes opt out of hydration text and style checks.
 */
export function BootLoader() {
  return (
    <div className="boot-loader" data-boot-loader aria-hidden="true">
      <div className="boot-loader__panel">
        <p className="boot-loader__status">
          <span>Loading portfolio</span>
          <span className="boot-loader__value">
            <span data-boot-loader-value suppressHydrationWarning>000</span>%
          </span>
        </p>
        <span className="boot-loader__track">
          <span
            className="boot-loader__fill"
            data-boot-loader-fill
            suppressHydrationWarning
          />
        </span>
        <p className="boot-loader__caption">Brett Haas</p>
      </div>
    </div>
  )
}
