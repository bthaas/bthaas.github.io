import { renderLlmsTxt } from './llms-txt'
import { agentReadablePages, requireMarkdownPath } from './registry'

export interface AgentReadableFile {
  /** Site-absolute output path, e.g. `/llms.txt` or `/projects/courtvision.md`. */
  readonly path: string
  readonly content: string
}

/** Every static file agents can read: llms.txt plus one Markdown twin per page. */
export function createAgentReadableFiles(): readonly AgentReadableFile[] {
  return [
    { path: '/llms.txt', content: renderLlmsTxt() },
    ...agentReadablePages.map(({ pagePath, render }) => ({
      path: requireMarkdownPath(pagePath),
      content: render(),
    })),
  ]
}
