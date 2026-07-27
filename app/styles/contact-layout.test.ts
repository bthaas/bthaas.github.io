import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type AtRule, type Root } from 'postcss'
import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/contact.css'), 'utf8')
const root = postcss.parse(stylesheet)

function declarations(source: Root | AtRule, selector: string) {
  const values: Record<string, string> = {}

  source.walkRules(selector, (rule) => {
    if (rule.parent !== source) return
    rule.walkDecls((declaration) => {
      values[declaration.prop] = declaration.value
    })
  })

  return values
}

describe('Contact layout', () => {
  it('extends the desktop board and center divider through the full viewport', () => {
    expect(declarations(root, '.contact-section')).toMatchObject({
      'min-height': '100svh',
    })
    expect(declarations(root, '.contact-board')).toMatchObject({
      'min-height': '100svh',
    })
  })

  it('preserves the mobile bottom-navigation rail', () => {
    let portraitMobile: AtRule | undefined

    root.walkAtRules('media', (rule) => {
      if (
        rule.params.includes('max-width: 720px')
        && rule.params.includes('orientation: portrait')
      ) {
        portraitMobile = rule
      }
    })

    expect(portraitMobile).toBeDefined()
    expect(
      declarations(portraitMobile as AtRule, '.contact-section,\n  .contact-board'),
    ).toMatchObject({
      'min-height': 'calc(100svh - 55px)',
    })
  })
})
