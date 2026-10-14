import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

function declarationsFor(selector: string): Record<string, string> {
  const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/boot-loader.css'), 'utf8')
  const declarations: Record<string, string> = {}
  postcss.parse(stylesheet).walkRules(selector, (rule: Rule) => {
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })
  return declarations
}

describe('boot loader stylesheet', () => {
  it('stays hidden unless the inline boot script activates it', () => {
    expect(declarationsFor('.boot-loader')).toEqual({ display: 'none' })
    expect(declarationsFor('html[data-atlas-boot] .boot-loader')).toMatchObject({
      display: 'grid',
      inset: '0',
      position: 'fixed',
      'z-index': '2400',
    })
  })

  it('reveals the gateway from the top and stops intercepting input while exiting', () => {
    expect(declarationsFor('html[data-atlas-boot="exiting"] .boot-loader')).toMatchObject({
      'clip-path': 'inset(100% 0 0 0)',
      'pointer-events': 'none',
    })
  })

  it('fills the bar from the left edge', () => {
    expect(declarationsFor('.boot-loader__fill')).toMatchObject({
      transform: 'scaleX(0)',
      'transform-origin': 'left center',
    })
  })
})
