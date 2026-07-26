import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const stylesheetPath = resolve(process.cwd(), 'app/styles/editorial-base.css')

function declarationsFor(stylesheet: string, selector: string): Record<string, string> {
  const declarations: Record<string, string> = {}

  postcss.parse(stylesheet).walkRules((rule: Rule) => {
    if (!rule.selectors.includes(selector)) return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })

  return declarations
}

describe('shared editorial base styles', () => {
  it('keeps non-hero typography and responsive picture primitives intact', () => {
    expect(existsSync(stylesheetPath)).toBe(true)
    const stylesheet = readFileSync(stylesheetPath, 'utf8')

    expect(declarationsFor(stylesheet, '.eyebrow')).toMatchObject({
      'font-size': '0.62rem',
      'font-weight': '700',
      'text-transform': 'uppercase',
    })
    expect(declarationsFor(stylesheet, '.atlas-picture')).toMatchObject({
      position: 'relative',
      overflow: 'hidden',
    })
    expect(declarationsFor(stylesheet, '.atlas-picture img')).toMatchObject({
      width: '100%',
      height: '100%',
      'object-fit': 'cover',
    })
  })
})
