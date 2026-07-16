import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

describe('header brand mark', () => {
  it('renders the favicon with its original light and dark colors', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/header.css'), 'utf8')
    const root = postcss.parse(stylesheet)
    let filter: string | undefined

    root.walkRules('.nav-name__mark', (rule) => {
      rule.walkDecls('filter', (declaration) => {
        filter = declaration.value
      })
    })

    expect(filter).toBeUndefined()
  })
})
