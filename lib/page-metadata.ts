import type { Metadata } from 'next'

import { getMarkdownPath } from '@/lib/agent-readable/markdown-paths'

type PageAlternates = NonNullable<Metadata['alternates']>

/** Canonical URL plus the `text/markdown` alternate that agents can request. */
export function getPageAlternates(path: string): PageAlternates {
  const markdownPath = getMarkdownPath(path)
  if (!markdownPath) return { canonical: path }
  return { canonical: path, types: { 'text/markdown': markdownPath } }
}
