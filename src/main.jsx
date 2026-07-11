import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import Portfolio from './Portfolio.jsx'
import './index.css'

const ACCESS_KEY = 'portfolio-access-granted'

const PasswordGate = () => {
  const [isUnlocked, setIsUnlocked] = useState(
    () => window.sessionStorage.getItem(ACCESS_KEY) === 'true',
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (password === 'bubba') {
      window.sessionStorage.setItem(ACCESS_KEY, 'true')
      setIsUnlocked(true)
      return
    }

    setError('That password is not correct. Please try again.')
    setPassword('')
  }

  if (isUnlocked) {
    return <Portfolio />
  }

  return (
    <main className="construction-page">
      <div className="construction-glow construction-glow-one" />
      <div className="construction-glow construction-glow-two" />

      <section className="construction-card" aria-labelledby="construction-title">
        <div className="construction-status">
          <span className="construction-status-dot" aria-hidden="true" />
          Work in progress
        </div>

        <p className="construction-eyebrow">Brett Haas // Portfolio</p>
        <h1 id="construction-title">Under construction.</h1>
        <p className="construction-copy">
          I’m making a few updates behind the scenes. Enter the password to view
          the current site.
        </p>

        <form className="construction-form" onSubmit={handleSubmit}>
          <label htmlFor="site-password">Password</label>
          <div className="construction-input-row">
            <input
              id="site-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (error) setError('')
              }}
              placeholder="Enter password"
              autoComplete="current-password"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'password-error' : undefined}
            />
            <button type="submit">Enter site</button>
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
      </section>

      <p className="construction-footer">Check back soon.</p>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PasswordGate />
  </React.StrictMode>,
)



