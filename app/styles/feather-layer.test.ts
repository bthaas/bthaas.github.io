import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

function declarationsFor(selector: string): Record<string, string> {
  const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/phase-two.css'), 'utf8')
  const declarations: Record<string, string> = {}
  postcss.parse(stylesheet).walkRules(selector, (rule: Rule) => {
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = `${declaration.value}${declaration.important ? ' !important' : ''}`
    })
  })
  return declarations
}

describe('decorative feather layer input contract', () => {
  it('keeps generated wrapper descendants from intercepting page interactions', () => {
    expect(declarationsFor('.feather-fall-layer *')).toMatchObject({
      'pointer-events': 'none !important',
    })
  })
})
