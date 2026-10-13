import type { DocumentBlock, InlineText } from '@/content/editorial-documents'
import { SITE_URL } from '@/lib/site-config'

/** Escapes characters that would otherwise change Markdown structure inside prose. */
export function escapeMarkdown(text: string): string {
  return text
    .replace(/([\\`*_[\]])/g, '\\$1')
    .replace(/<(?=[A-Za-z/!?])/g, '\\<')
}

/** Resolves site-relative links to absolute URLs so Markdown stays portable. */
export function absoluteUrl(href: string): string {
  return href.startsWith('/') ? `${SITE_URL}${href}` : href
}

export function markdownLink(text: string, href: string): string {
  const destination = absoluteUrl(href).replace(/ /g, '%20').replace(/\)/g, '%29')
  return `[${escapeMarkdown(text)}](${destination})`
}

export function renderInline(content: InlineText): string {
  return content
    .map((segment) => (
      typeof segment === 'string' ? escapeMarkdown(segment) : markdownLink(segment.text, segment.href)
    ))
    .join('')
}

export function renderList(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join('\n')
}

export function renderBlock(block: DocumentBlock): string {
  if (block.kind === 'paragraph') return renderInline(block.content)
  return renderList(block.items.map(renderInline))
}

/** Joins non-empty blocks with blank lines and ends the document with a newline. */
export function joinMarkdown(blocks: readonly (string | null)[]): string {
  return `${blocks.filter((block): block is string => Boolean(block)).join('\n\n')}\n`
}
