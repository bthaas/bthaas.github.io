import { aboutDocument, privacyDocument } from '@/content/editorial-documents'
import { siteContent } from '@/content/site-content'

import { getMarkdownPath } from './markdown-paths'
import {
  renderContactMarkdown,
  renderEditorialDocumentMarkdown,
  renderExperienceMarkdown,
  renderHomeMarkdown,
  renderProjectMarkdown,
  renderProjectsMarkdown,
  renderSkillsMarkdown,
} from './pages'

export type AgentReadableGroup = 'Portfolio' | 'Projects' | 'Policies'

export interface AgentReadablePage {
  readonly group: AgentReadableGroup
  readonly label: string
  readonly note: string
  readonly pagePath: string
  readonly render: () => string
}

/** Every HTML page that has a Markdown twin, in llms.txt order. */
export const agentReadablePages: readonly AgentReadablePage[] = [
  {
    group: 'Portfolio',
    label: 'Home',
    note: 'Overview of Brett Haas and the four portfolio sections.',
    pagePath: '/',
    render: renderHomeMarkdown,
  },
  {
    group: 'Portfolio',
    label: 'About',
    note: 'Background, focus, education, experience, projects, and tools on one page.',
    pagePath: aboutDocument.path,
    render: () => renderEditorialDocumentMarkdown(aboutDocument),
  },
  {
    group: 'Portfolio',
    label: 'Experience',
    note: 'Roles with dates, locations, highlights, and technologies, plus education.',
    pagePath: '/experience',
    render: renderExperienceMarkdown,
  },
  {
    group: 'Portfolio',
    label: 'Projects',
    note: 'All selected projects with technologies, results, and repositories.',
    pagePath: '/projects',
    render: renderProjectsMarkdown,
  },
  {
    group: 'Portfolio',
    label: 'Skills',
    note: 'Languages, frameworks, cloud and DevOps tools, databases, and AI/ML methods.',
    pagePath: '/skills',
    render: renderSkillsMarkdown,
  },
  {
    group: 'Portfolio',
    label: 'Contact',
    note: 'Email, GitHub, LinkedIn, and location.',
    pagePath: '/contact',
    render: renderContactMarkdown,
  },
  ...siteContent.projects.map((project): AgentReadablePage => ({
    group: 'Projects',
    label: project.name,
    note: `${project.description} Brief, approach, technical focus, and results.`,
    pagePath: `/projects/${project.id}`,
    render: () => renderProjectMarkdown(project),
  })),
  {
    group: 'Policies',
    label: 'Privacy policy',
    note: 'What data the site and its hosting providers process, and how email is handled.',
    pagePath: privacyDocument.path,
    render: () => renderEditorialDocumentMarkdown(privacyDocument),
  },
]

export function requireMarkdownPath(pagePath: string): string {
  const markdownPath = getMarkdownPath(pagePath)
  if (!markdownPath) throw new Error(`No Markdown path can be derived for ${pagePath}`)
  return markdownPath
}
