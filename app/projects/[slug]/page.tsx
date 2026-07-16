import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProjectCaseStudy } from '@/components/portfolio/ProjectCaseStudy'
import { siteContent } from '@/content/site-content'

interface ProjectPageProps {
  readonly params: Promise<{ slug: string }>
}

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return siteContent.projects.map(({ id }) => ({ slug: id }))
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = siteContent.projects.find(({ id }) => id === slug)
  if (!project) return { title: 'Project not found — Brett Haas' }

  return {
    title: `${project.name} — Brett Haas`,
    description: project.description,
    alternates: { canonical: `/projects/${project.id}` },
    openGraph: {
      title: `${project.name} — Brett Haas`,
      description: project.description,
      images: [{ url: `/icarus-atlas/project-${project.visualKey}-1200.webp` }],
      type: 'article',
    },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const projectIndex = siteContent.projects.findIndex(({ id }) => id === slug)
  if (projectIndex === -1) notFound()

  const project = siteContent.projects[projectIndex]
  const nextProject = siteContent.projects[(projectIndex + 1) % siteContent.projects.length]

  return (
    <>
      <a className="skip-link" href="#project-case-study">
        Skip to case study
      </a>
      <header className="site-header project-site-header">
        <nav className="site-nav atlas-shell" aria-label="Project navigation">
          <a className="nav-name" href="/">
            <img
              className="nav-name__mark"
              src="/original-wing-filled.png"
              alt=""
              width="128"
              height="128"
              aria-hidden="true"
            />
            Brett Haas
          </a>
          <a className="project-back-link" href="/#projects">
            Back to projects
          </a>
        </nav>
      </header>
      <main className="project-page" id="project-case-study">
        <ProjectCaseStudy project={project} projectIndex={projectIndex} />
        <nav className="project-page__footer atlas-shell" aria-label="More projects">
          <a href="/#projects">
            <span aria-hidden="true">←</span> All projects
          </a>
          <a href={`/projects/${nextProject.id}`}>
            Next / {nextProject.name} <span aria-hidden="true">→</span>
          </a>
        </nav>
      </main>
    </>
  )
}
