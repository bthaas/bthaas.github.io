import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type AtRule, type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

function declarationsFor(
  stylesheet: string,
  selector: string,
  mediaQuery?: string,
): Record<string, string> {
  const root = postcss.parse(stylesheet)
  const declarations: Record<string, string> = {}

  root.walkRules(selector, (rule: Rule) => {
    const parent = rule.parent
    const parentMedia = parent?.type === 'atrule' && (parent as AtRule).name === 'media'
      ? (parent as AtRule).params
      : undefined

    if (parentMedia !== mediaQuery) return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })

  return declarations
}

describe('Experience and Skills split boards', () => {
  it('gives artwork and copy equal desktop columns with inset plates', () => {
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )
    const craftStyles = readFileSync(resolve(process.cwd(), 'app/styles/craft.css'), 'utf8')

    expect(declarationsFor(experienceStyles, '.experience-board')).toMatchObject({
      display: 'grid',
      'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
    })
    expect(declarationsFor(craftStyles, '.craft-board')).toMatchObject({
      display: 'grid',
      'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
    })
    expect(declarationsFor(experienceStyles, '.experience-plate--inset')).toMatchObject({
      margin: 'clamp(1rem, 1.5vw, 1.75rem)',
      'border-radius': 'clamp(1rem, 1.8vw, 1.6rem)',
    })
    expect(declarationsFor(craftStyles, '.craft-plate--inset')).toMatchObject({
      margin: 'clamp(1rem, 1.5vw, 1.75rem)',
      'border-radius': 'clamp(1rem, 1.8vw, 1.6rem)',
    })
  })

  it('stacks each image above its copy on narrow screens', () => {
    const mediaQuery = '(max-width: 720px)'
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )
    const craftStyles = readFileSync(resolve(process.cwd(), 'app/styles/craft.css'), 'utf8')

    expect(declarationsFor(experienceStyles, '.experience-board', mediaQuery)).toMatchObject({
      'grid-template-columns': '1fr',
    })
    expect(declarationsFor(craftStyles, '.craft-board', mediaQuery)).toMatchObject({
      'grid-template-columns': '1fr',
    })
  })
})
