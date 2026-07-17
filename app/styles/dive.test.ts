import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

function declarationsFor(stylesheet: string, selector: string): Record<string, string> {
  const declarations: Record<string, string> = {}
  postcss.parse(stylesheet).walkRules(selector, (rule: Rule) => {
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })
  return declarations
}

describe('dive sequence styles', () => {
  it('keeps the long track enhancement-only and full viewport while active', () => {
    const styles = readFileSync(resolve(process.cwd(), 'app/styles/dive.css'), 'utf8')

    expect(declarationsFor(styles, '.dive-section')).toMatchObject({ display: 'none' })
    expect(declarationsFor(styles, 'html.atlas-js .dive-section')).toMatchObject({
      background: '#202a44',
      display: 'block',
    })
    expect(declarationsFor(styles, 'html.atlas-js .dive-track')).toMatchObject({
      height: '400vh',
    })
    expect(declarationsFor(styles, 'html.atlas-js .dive-sticky')).toMatchObject({
      height: '100vh',
      overflow: 'hidden',
      position: 'sticky',
      top: '0',
    })
    expect(declarationsFor(styles, 'html.atlas-js .dive-canvas')).toMatchObject({
      display: 'block',
      height: '100%',
      width: '100%',
    })
  })

  it('shares the abyss token with the Experience section and imports the stylesheet', () => {
    const base = readFileSync(resolve(process.cwd(), 'app/styles/base.css'), 'utf8')
    const experience = readFileSync(resolve(process.cwd(), 'app/styles/experience.css'), 'utf8')
    const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

    expect(declarationsFor(base, ':root')).toMatchObject({ '--abyss': '#202a44' })
    expect(declarationsFor(experience, '.experience-section')).toMatchObject({
      background: 'var(--abyss)',
    })
    expect(globals).toContain("@import './styles/dive.css';")
  })
})
