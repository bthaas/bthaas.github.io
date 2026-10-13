import {
  aboutDocument,
  type EditorialDocument,
  privacyDocument,
} from '@/content/editorial-documents'
import { siteContent, type Project } from '@/content/site-content'
import { siteOverview } from '@/content/site-overview'
import { contactCopy, sitePages } from '@/content/site-pages'

import {
  escapeMarkdown,
  joinMarkdown,
  markdownLink,
  renderBlock,
  renderList,
} from './markdown'

const { contact, education, experience, identity, projects, skills } = siteContent

function heading(level: 1 | 2 | 3, text: string): string {
  return `${'#'.repeat(level)} ${escapeMarkdown(text)}`
}

function summary(text: string): string {
  return `> ${escapeMarkdown(text)}`
}

function contactLinks(): string {
  return renderList([
    `Email: ${markdownLink(contact.email, `mailto:${contact.email}`)}`,
    `GitHub: ${markdownLink(contact.github.replace('https://', ''), contact.github)}`,
    `LinkedIn: ${markdownLink(contact.linkedin.replace('https://', ''), contact.linkedin)}`,
    `Location: ${escapeMarkdown(identity.location)} (US Pacific Time)`,
  ])
}

export function renderHomeMarkdown(): string {
  return joinMarkdown([
    heading(1, identity.name),
    summary(siteOverview.summary),
    escapeMarkdown(siteOverview.scope),
    heading(2, 'Portfolio sections'),
    renderList(siteOverview.sections.map(({ label, path, description }) => (
      `${markdownLink(label, path)}: ${escapeMarkdown(description)}`
    ))),
    heading(2, 'About this site'),
    renderList([
      `${markdownLink('About', aboutDocument.path)}: Background, education, experience, projects, and tools.`,
      `${markdownLink('Privacy policy', privacyDocument.path)}: How the site and its hosting providers handle visitor data.`,
      `${markdownLink('llms.txt', '/llms.txt')}: Guide for AI agents with the Markdown version of every page.`,
    ]),
    heading(2, 'Contact'),
    contactLinks(),
  ])
}

export function renderExperienceMarkdown(): string {
  const roles = experience.flatMap((entry) => [
    heading(2, `${entry.role}, ${entry.organization}`),
    renderList([
      `Period: ${escapeMarkdown(entry.period)}`,
      ...(entry.team ? [`Team: ${escapeMarkdown(entry.team)}`] : []),
      ...(entry.location ? [`Location: ${escapeMarkdown(entry.location)}`] : []),
      `Technologies: ${escapeMarkdown(entry.technologies.join(', '))}`,
    ]),
    entry.summary ? escapeMarkdown(entry.summary) : null,
    renderList(entry.highlights.map(escapeMarkdown)),
  ])
  const schools = education.flatMap((entry) => [
    heading(3, `${entry.degree}, ${entry.institution}`),
    renderList([
      `Graduation: ${escapeMarkdown(entry.graduation)}`,
      `Location: ${escapeMarkdown(entry.location)}`,
      `GPA: ${escapeMarkdown(entry.gpa)}`,
      `Focus areas: ${escapeMarkdown(entry.focusAreas.join(', '))}`,
      `Coursework: ${escapeMarkdown(entry.coursework.join(', '))}`,
    ]),
  ])

  return joinMarkdown([
    heading(1, 'Experience'),
    summary(sitePages.experience.description),
    ...roles,
    heading(2, 'Education'),
    ...schools,
  ])
}

function projectResults(project: Project): string {
  return renderList(project.metrics.map(({ value, label }) => (
    `${escapeMarkdown(value)} ${escapeMarkdown(label)}`
  )))
}

export function renderProjectsMarkdown(): string {
  return joinMarkdown([
    heading(1, 'Projects'),
    summary(sitePages.projects.description),
    ...projects.flatMap((project) => [
      heading(2, project.name),
      escapeMarkdown(project.description),
      renderList([
        `Case study: ${markdownLink(`${project.name} case study`, `/projects/${project.id}`)}`,
        `Technologies: ${escapeMarkdown(project.technologies.join(', '))}`,
        `Repository: ${markdownLink(project.links.repository.replace('https://', ''), project.links.repository)}`,
        `Results: ${project.metrics.map(({ value, label }) => escapeMarkdown(`${value} ${label}`)).join('; ')}`,
      ]),
    ]),
  ])
}

export function renderProjectMarkdown(project: Project): string {
  const index = projects.findIndex(({ id }) => id === project.id)
  const next = projects[(index + 1) % projects.length]

  return joinMarkdown([
    heading(1, project.name),
    summary(project.description),
    `Case ${String(index + 1).padStart(2, '0')} of ${String(projects.length).padStart(2, '0')}. Technologies: ${escapeMarkdown(project.technologies.join(', '))}.`,
    heading(2, 'Brief'),
    escapeMarkdown(project.caseStudy.brief),
    heading(2, 'Approach'),
    escapeMarkdown(project.caseStudy.approach),
    heading(2, 'Technical focus'),
    escapeMarkdown(project.caseStudy.focus),
    heading(2, 'Results'),
    projectResults(project),
    heading(2, 'Links'),
    renderList([
      markdownLink('Repository', project.links.repository),
      markdownLink('All projects', '/projects'),
      markdownLink(`Next project: ${next.name}`, `/projects/${next.id}`),
    ]),
  ])
}

export function renderSkillsMarkdown(): string {
  return joinMarkdown([
    heading(1, 'Skills'),
    summary(sitePages.skills.description),
    ...Object.entries(skills).flatMap(([category, entries]) => [
      heading(2, category),
      renderList(entries.map(escapeMarkdown)),
    ]),
  ])
}

export function renderContactMarkdown(): string {
  return joinMarkdown([
    heading(1, 'Contact'),
    summary(sitePages.contact.description),
    escapeMarkdown(contactCopy.intro),
    contactLinks(),
    escapeMarkdown(contactCopy.note),
    `Privacy: ${markdownLink('How messages and visits are handled', privacyDocument.path)}.`,
  ])
}

export function renderEditorialDocumentMarkdown(document: EditorialDocument): string {
  return joinMarkdown([
    heading(1, document.title),
    summary(document.lede),
    document.updated ? `Effective ${escapeMarkdown(document.updated)}.` : null,
    ...document.sections.flatMap((section) => [
      heading(2, section.heading),
      ...section.blocks.map(renderBlock),
    ]),
  ])
}
