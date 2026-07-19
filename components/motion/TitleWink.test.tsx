import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TitleWink } from './TitleWink'

describe('TitleWink', () => {
  afterEach(() => {
    document.title = ''
  })

  it('winks while hidden and restores the current page title on focus', () => {
    let state: DocumentVisibilityState = 'visible'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => state,
    })
    document.title = 'Brett Haas'
    render(<TitleWink />)

    state = 'hidden'
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(document.title).toBe('Come back — the atlas is still open.')
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(document.title).toBe('Come back — the atlas is still open.')

    state = 'visible'
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(document.title).toBe('Brett Haas')
  })
})
