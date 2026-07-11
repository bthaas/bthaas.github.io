import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { SiteGate } from './SiteGate'

describe('SiteGate', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('shows the construction page while keeping the portfolio hidden', () => {
    render(
      <SiteGate>
        <h1>Private portfolio</h1>
      </SiteGate>,
    )

    expect(screen.getByRole('heading', { name: 'Under construction.' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Private portfolio' })).not.toBeInTheDocument()
  })

  it('shows an error and keeps the gate closed for an incorrect password', () => {
    render(
      <SiteGate>
        <h1>Private portfolio</h1>
      </SiteGate>,
    )

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'incorrect' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enter site' }))

    expect(screen.getByRole('alert')).toHaveTextContent('That password is not correct.')
    expect(screen.queryByRole('heading', { name: 'Private portfolio' })).not.toBeInTheDocument()
  })

  it('reveals the portfolio and remembers access for the browser session', () => {
    render(
      <SiteGate>
        <h1>Private portfolio</h1>
      </SiteGate>,
    )

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'bubba' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enter site' }))

    expect(screen.getByRole('heading', { name: 'Private portfolio' })).toBeInTheDocument()
    expect(window.sessionStorage.getItem('portfolio-access-granted')).toBe('true')
  })
})
