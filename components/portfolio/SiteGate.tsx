'use client'

import { type FormEvent, type ReactNode, useEffect, useState } from 'react'

const ACCESS_KEY = 'portfolio-access-granted'
const ACCESS_PASSWORD = 'bubba'

export function SiteGate({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setIsUnlocked(window.sessionStorage.getItem(ACCESS_KEY) === 'true')
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password === ACCESS_PASSWORD) {
      window.sessionStorage.setItem(ACCESS_KEY, 'true')
      setIsUnlocked(true)
      return
    }

    setError('That password is not correct. Please try again.')
    setPassword('')
  }

  if (isUnlocked) return children

  return (
    <main className="construction-page">
      <div className="construction-atmosphere" aria-hidden="true">
        <span className="construction-orbit construction-orbit-one" />
        <span className="construction-orbit construction-orbit-two" />
        <span className="construction-star construction-star-one">✦</span>
        <span className="construction-star construction-star-two">✦</span>
        <span className="construction-star construction-star-three">✧</span>
      </div>

      <section className="construction-shell" aria-labelledby="construction-title">
        <div className="construction-frieze" aria-hidden="true" />

        <div className="construction-card">
          <div className="construction-brand" aria-label="Brett Haas portfolio">
            <img src="/assets/wing-mark.png" alt="" />
            <span>
              Brett Haas
              <small>Portfolio</small>
            </span>
          </div>

          <div className="construction-status">
            <span className="construction-status-dot" aria-hidden="true" />
            Private preview · In progress
          </div>

          <p className="construction-eyebrow">The Icarus Archive // Study 01</p>
          <h1 id="construction-title">
            The wings are still <em>being forged.</em>
          </h1>
          <p className="construction-copy">
            I’m refining the portfolio before its next flight. If you have the
            passphrase, step inside for an early look.
          </p>

          <form className="construction-form" onSubmit={handleSubmit}>
            <label htmlFor="site-password">Passphrase</label>
            <div className="construction-input-row">
              <input
                id="site-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (error) setError('')
                }}
                placeholder="Speak the passphrase"
                autoComplete="current-password"
                autoFocus
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'password-error' : undefined}
              />
              <button type="submit">
                Enter the archive
                <span aria-hidden="true">↗</span>
              </button>
            </div>
            <p
              id="password-error"
              className="construction-error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          </form>
        </div>

        <div className="construction-visual" aria-hidden="true">
          <img src="/assets/icarus-wings-fallback.webp" alt="" />
          <div className="construction-sun">
            <span />
          </div>
          <p className="construction-visual-caption">
            <span>Icarus</span>
            A study in ambition &amp; ascent
          </p>
          <span className="construction-study-number">01</span>
        </div>
      </section>

      <p className="construction-footer">
        <span>Built between earth &amp; sun</span>
        Charlottesville, Virginia
      </p>
    </main>
  )
}
