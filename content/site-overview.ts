import { siteContent } from './site-content'

export interface SiteSection {
  readonly label: 'Experience' | 'Projects' | 'Skills' | 'Contact'
  readonly path: '/experience' | '/projects' | '/skills' | '/contact'
  readonly description: string
}

export interface SiteOverview {
  readonly summary: string
  readonly scope: string
  readonly sections: readonly SiteSection[]
}

export function joinNames(names: readonly string[]): string {
  if (names.length < 3) return names.join(' and ')
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`
}

function describeExperience(): string {
  const roles = siteContent.experience.map(({ organization, role }) => `${role} at ${organization}`)
  const [education] = siteContent.education
  return `${joinNames(roles)}, with highlights, dates, and technologies for each role, plus a ${education.degree} from ${education.institution} (${education.graduation}).`
}

function describeProjects(): string {
  const projects = siteContent.projects.map(({ name, description }) => (
    `${name} (${description.replace(/\.$/, '')})`
  ))
  return `Case studies with goals, approach, technical focus, and measured results: ${projects.join('; ')}.`
}

function describeSkills(): string {
  const categories = Object.keys(siteContent.skills)
  return `An interactive workbench of skills grouped as ${joinNames(categories)}, from ${joinNames(siteContent.skills.Languages.slice(0, 3))} to ${joinNames(siteContent.skills['AI / ML'].slice(-2))}.`
}

function describeContact(): string {
  return `Email, GitHub, and LinkedIn links for conversations about software engineering, machine learning, and research. Based in ${siteContent.identity.location}.`
}

/** Plain-language overview shared by the homepage, its Markdown twin, and llms.txt. */
export const siteOverview: SiteOverview = {
  summary: `${siteContent.identity.name} is a ${siteContent.identity.title.toLowerCase()} in ${siteContent.identity.location}, building ambitious products across AI, web, mobile, and intelligent systems.`,
  scope: 'This portfolio collects applied AI research on language-model steering, frontier-model safety and evaluation work, production mobile and cloud engineering, selected projects, and ways to get in touch.',
  sections: [
    { label: 'Experience', path: '/experience', description: describeExperience() },
    { label: 'Projects', path: '/projects', description: describeProjects() },
    { label: 'Skills', path: '/skills', description: describeSkills() },
    { label: 'Contact', path: '/contact', description: describeContact() },
  ],
}
