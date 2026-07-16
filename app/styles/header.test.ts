import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

describe('header brand mark', () => {
  it('renders the centered favicon one pixel larger than the approved size', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/header.css'), 'utf8')
    const root = postcss.parse(stylesheet)
    let filter: string | undefined
    let height: string | undefined
    let transform: string | undefined
    let width: string | undefined

    root.walkRules('.nav-name__mark', (rule) => {
      rule.walkDecls('filter', (declaration) => {
        filter = declaration.value
      })
      rule.walkDecls('height', (declaration) => {
        height = declaration.value
      })
      rule.walkDecls('transform', (declaration) => {
        transform = declaration.value
      })
      rule.walkDecls('width', (declaration) => {
        width = declaration.value
      })
    })

    expect(filter).toBeUndefined()
    expect({ height, transform, width }).toEqual({
      height: 'calc(1.4rem + 1px)',
      transform: undefined,
      width: 'calc(1.4rem + 1px)',
    })
  })
})
