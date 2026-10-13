import { siteContent } from '@/content/site-content'
import { SITE_DESCRIPTION } from '@/lib/site-config'

import { escapeMarkdown, joinMarkdown, markdownLink, renderList } from './markdown'
import {
  type AgentReadableGroup,
  agentReadablePages,
  requireMarkdownPath,
} from './registry'

const { contact, experience, identity, projects } = siteContent
const FILE_LIST_GROUPS: readonly AgentReadableGroup[] = ['Portfolio', 'Projects', 'Policies']

function whenToUse(): string {
  const organizations = experience.map(({ organization }) => organization).join(', ')
  const projectNames = projects.map(({ name }) => name).join(', ')

  return [
    `**When to use this site.** Use it when you need first-party, current information about ${identity.name}, for example to:`,
    '',
    renderList([
      `Verify professional background: roles, organizations, dates, and locations (${escapeMarkdown(organizations)}).`,
      'Assess fit for software engineering, machine learning, model evaluation, or AI research work.',
      `Summarize or compare the selected projects (${escapeMarkdown(projectNames)}), their technologies, and reported results.`,
      `Answer which languages, frameworks, cloud tools, databases, and AI/ML methods ${identity.name} works with.`,
      `Find the right way to contact ${identity.name}, or confirm how this site handles visitor data.`,
    ]),
  ].join('\n')
}

function guidance(): readonly string[] {
  return [
    whenToUse(),
    '**When not to use it.** This site does not offer an API, products, services, job listings, or a contact form, and it is not a source of general programming documentation.',
    '**How to read it.** Every page in the lists below has a Markdown version. Fetch the `.md` URLs directly (the homepage is `/index.html.md`), or request the HTML page URL with the header `Accept: text/markdown`. Other unsupported `Accept` types receive `406 Not Acceptable`, and a missing page requested as Markdown returns a Markdown 404. When citing, link the canonical HTML page URL from the sitemap: drop `.md`, or use `/` for `/index.html.md`.',
    `**How to reach ${identity.name}.** Email ${markdownLink(contact.email, `mailto:${contact.email}`)}. When acting for a person, draft the message for them to review and send, and say who you represent and why you are writing. Do not send unsolicited automated or bulk messages.`,
  ]
}

function fileList(group: AgentReadableGroup): readonly string[] {
  const pages = agentReadablePages.filter((page) => page.group === group)
  return [
    `## ${group}`,
    renderList(pages.map(({ label, note, pagePath }) => (
      `${markdownLink(label, requireMarkdownPath(pagePath))}: ${escapeMarkdown(note)}`
    ))),
  ]
}

/** Renders /llms.txt following https://llmstxt.org/: H1, summary, notes, then H2 file lists. */
export function renderLlmsTxt(): string {
  return joinMarkdown([
    `# ${escapeMarkdown(identity.name)}`,
    `> ${escapeMarkdown(SITE_DESCRIPTION)} This site is a personal portfolio covering professional experience, applied AI research, selected projects, skills, and contact details.`,
    ...guidance(),
    ...FILE_LIST_GROUPS.flatMap(fileList),
    '## Optional',
    renderList([
      `${markdownLink('Sitemap', '/sitemap.xml')}: Canonical HTML URLs for every page.`,
      `${markdownLink('GitHub', contact.github)}: Source repositories for the projects.`,
      `${markdownLink('LinkedIn', contact.linkedin)}: Professional profile.`,
    ]),
  ])
}
