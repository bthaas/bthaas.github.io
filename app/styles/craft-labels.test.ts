import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const longSkillSelectors = [
  '.skill-logo[data-skill-logo="PostgreSQL"] .skill-logo__name',
  '.skill-logo[data-skill-logo="Kubernetes"] .skill-logo__name',
  '.skill-logo[data-skill-logo="TensorFlow"] .skill-logo__name',
]

describe('long skill logo previews', () => {
  it('keeps the three longest technology names inside their tiles', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/craft.css'), 'utf8')
    const root = postcss.parse(stylesheet)
    const declarations: Record<string, string> = {}

    root.walkRules((rule) => {
      if (!longSkillSelectors.every((selector) => rule.selectors.includes(selector))) return

      rule.walkDecls((declaration) => {
        declarations[declaration.prop] = declaration.value
      })
    })

    expect(declarations).toMatchObject({
      'font-size': 'clamp(0.4rem, 0.52vw, 0.52rem)',
      'letter-spacing': '0.02em',
      'overflow-wrap': 'anywhere',
      'padding-inline': '0.2rem',
    })
  })
})
