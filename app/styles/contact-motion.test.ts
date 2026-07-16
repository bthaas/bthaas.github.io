import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('contact motion fallback', () => {
  it('only hides new scroll elements after their runtime initializes', () => {
    const stylesheet = readFileSync(
      resolve(process.cwd(), 'app/styles/motion.css'),
      'utf8',
    )

    expect(stylesheet).toContain(
      'html.atlas-js [data-contact-scroll-ready] [data-contact-detail]',
    )
    expect(stylesheet).toContain(
      'html.atlas-js [data-contact-scroll-ready] .contact-plate',
    )
    expect(stylesheet).toContain(
      'html.atlas-js [data-contact-scroll-ready] .contact-art img',
    )
    expect(stylesheet).not.toContain(
      'html.atlas-js [data-contact-ready] [data-contact-detail]',
    )
  })
})
