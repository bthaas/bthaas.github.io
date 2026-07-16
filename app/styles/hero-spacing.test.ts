import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

function declarationValue(stylesheet: string, selector: string, property: string) {
  const root = postcss.parse(stylesheet)
  let value: string | undefined

  root.walkRules(selector, (rule) => {
    rule.walkDecls(property, (declaration) => {
      value = declaration.value
    })
  })

  return value
}

describe('hero to experience spacing', () => {
  it('keeps the hero close to the following Experience section', () => {
    const heroStyles = readFileSync(resolve(process.cwd(), 'app/styles/hero.css'), 'utf8')
    const motionStyles = readFileSync(resolve(process.cwd(), 'app/styles/motion.css'), 'utf8')

    expect(declarationValue(heroStyles, '.hero-section', 'padding')).toBe(
      'clamp(1rem, 2vw, 1.8rem) 0 clamp(3rem, 5vw, 5rem)',
    )
    expect(declarationValue(motionStyles, '.hero-copy-release', 'padding-bottom')).toBe('16vh')
  })
})
