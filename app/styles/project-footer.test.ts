import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

describe('mobile project footer', () => {
  it('reserves enough safe-area space below its final route action for Atlas Corners', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/projects.css'), 'utf8')
    const root = postcss.parse(stylesheet)
    const mobilePaddingBottom: string[] = []

    root.walkAtRules('media', (media) => {
      if (!media.params.includes('max-width: 720px')) return

      media.walkRules('.project-page__footer', (rule) => {
        if (rule.parent !== media) return
        rule.walkDecls('padding-bottom', (declaration) => {
          mobilePaddingBottom.push(declaration.value)
        })
      })
    })

    expect(mobilePaddingBottom).toContain(
      'calc(7rem + env(safe-area-inset-bottom))',
    )
  })
})
