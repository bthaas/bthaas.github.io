export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-plate">
        <img src="/assets/wing-mark.png" alt="" aria-hidden="true" />
        <p className="eyebrow">404 / Missing plate</p>
        <h1>This plate is missing from the atlas.</h1>
        <p>The flight path continues from the opening plate.</p>
        <a className="text-link" href="/">
          Return to the atlas <span aria-hidden="true">↗</span>
        </a>
      </div>
    </main>
  )
}
