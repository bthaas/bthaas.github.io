/**
 * Markdown twins follow the llms.txt convention: a page URL gains `.md`, and a
 * URL without a file name (including `/`) gains `index.html.md`.
 * Shared by the build-time generator and the edge gateway, so it must stay
 * dependency-free.
 */

export const MARKDOWN_EXTENSION = '.md'
const INDEX_MARKDOWN = 'index.html.md'
const HTML_EXTENSION = '.html'

function lastSegment(pathname: string): string {
  return pathname.slice(pathname.lastIndexOf('/') + 1)
}

export function isMarkdownPath(pathname: string): boolean {
  return pathname.endsWith(MARKDOWN_EXTENSION)
}

/**
 * Returns the Markdown twin for an HTML page path, or `null` when the path
 * names a non-page asset (anything with an extension other than `.html`).
 */
export function getMarkdownPath(pathname: string): string | null {
  if (!pathname.startsWith('/')) return null
  if (pathname.endsWith('/')) return `${pathname}${INDEX_MARKDOWN}`

  const segment = lastSegment(pathname)
  if (segment.endsWith(HTML_EXTENSION)) {
    const base = pathname.slice(0, -HTML_EXTENSION.length)
    return lastSegment(base) === 'index'
      ? `${base.slice(0, -'index'.length)}${INDEX_MARKDOWN}`
      : `${base}${MARKDOWN_EXTENSION}`
  }
  if (segment.includes('.')) return null
  return `${pathname}${MARKDOWN_EXTENSION}`
}

/** Inverse of {@link getMarkdownPath} for canonical links on Markdown responses. */
export function getPagePathForMarkdown(pathname: string): string | null {
  if (!isMarkdownPath(pathname)) return null
  if (pathname.endsWith(`/${INDEX_MARKDOWN}`)) {
    return pathname.slice(0, -INDEX_MARKDOWN.length)
  }
  return pathname.slice(0, -MARKDOWN_EXTENSION.length)
}
