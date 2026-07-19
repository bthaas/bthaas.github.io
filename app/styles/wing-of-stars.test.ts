import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

function declarationsFor(selector: string): Record<string, string> {
  const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/craft.css'), 'utf8')
  const declarations: Record<string, string> = {}
  postcss.parse(stylesheet).walkRules(selector, (rule: Rule) => {
    if (rule.parent?.type !== 'root') return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })
  return declarations
}

describe('Wing of Stars presentation contract', () => {
  it('uses the existing deep dusk token and a responsive two-to-one desktop plate', () => {
    expect(declarationsFor('.wing-chart__sky')).toMatchObject({
      'aspect-ratio': '2 / 1',
      background: 'var(--dusk-deep)',
    })
  })

  it('gives each visual star an invisible 44px keyboard and touch target', () => {
    expect(declarationsFor('.wing-star')).toMatchObject({
      height: '44px',
      width: '44px',
    })
  })
})
