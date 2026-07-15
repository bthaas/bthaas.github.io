import { atlasVisuals } from '@/content/editorial-visuals'
import type { Project, ProjectVisualKey } from '@/content/site-content'

import { AtlasPicture } from './AtlasPicture'

export const projectVisualAlts: Record<ProjectVisualKey, string> = {
  courtvision: 'A geometric arena with analytical trajectory arcs',
  beatstream: 'Coastal architecture crossed by rhythmic signal ribbons',
  'vision-bias-steering': 'A labyrinth observatory with two controlled light paths',
}

export function ProjectCaseStudy({
  project,
  projectIndex,
}: {
  readonly project: Project
  readonly projectIndex: number
}) {
  return (
    <article
      className={`project-chapter project-chapter--${projectIndex + 1} project-page-study`}
      data-testid="project-case-study"
      aria-labelledby={`project-${project.id}-title`}
    >
      <div className="atlas-shell project-grid">
        <div className="project-meta" data-reveal-stagger>
          <p className="eyebrow project-case-label">
            Case {String(projectIndex + 1).padStart(2, '0')}
          </p>
          <p className="project-tech-list">{project.technologies.join(' · ')}</p>
        </div>

        <div className="project-title">
          <h1 id={`project-${project.id}-title`}>{project.name}</h1>
          <p>{project.description}</p>
        </div>

        <AtlasPicture
          visual={atlasVisuals.projects[project.visualKey]}
          alt={projectVisualAlts[project.visualKey]}
          className="atlas-picture project-art frame-reveal"
          projectPan
          projectPanIndex={projectIndex}
          reveal
          sizes="(max-width: 720px) 100vw, 58vw"
        />

        <div className="case-study-copy" data-reveal-stagger>
          <div>
            <h2>Brief</h2>
            <p>{project.caseStudy.brief}</p>
          </div>
          <div>
            <h2>Approach</h2>
            <p>{project.caseStudy.approach}</p>
          </div>
          <div>
            <h2>Technical focus</h2>
            <p>{project.caseStudy.focus}</p>
          </div>
        </div>

        <details className="project-results" data-testid="project-results">
          <summary aria-label={`View ${project.name} results`} data-cursor="expand">
            <span>View project results</span>
            <span className="project-results__symbol" aria-hidden="true">
              +
            </span>
          </summary>
          <dl className="project-results__metrics">
            {project.metrics.map((metric) => (
              <div key={`${metric.value}-${metric.label}`}>
                <dt>{metric.value}</dt>
                <dd>{metric.label}</dd>
              </div>
            ))}
          </dl>
        </details>

        <a
          className="repository-link"
          href={project.links.repository}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${project.name} repository`}
          data-magnetic
        >
          Repository <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  )
}
