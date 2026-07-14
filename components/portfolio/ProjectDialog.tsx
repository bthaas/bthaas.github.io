'use client'

import { ArrowUpRight, X } from 'lucide-react'
import { useEffect } from 'react'

import type { Project } from '@/content/site-content'
import { DialogFrame } from './DialogFrame'

interface ProjectDialogProps {
  readonly project: Project
  readonly onClose: () => void
}

export default function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={onClose}
    >
      <article
        aria-label={project.name}
        aria-modal="true"
        className="project-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <DialogFrame />
        <button className="dialog-close physical-button" onClick={onClose} aria-label="Close project">
          <X size={18} />
        </button>
        <p className="eyebrow">Selected work · {project.id.replaceAll('-', ' ')}</p>
        <h2>{project.name}</h2>
        <p className="dialog-copy">{project.longDescription}</p>
        <div className="tag-row">
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
        <a
          className="text-link physical-button"
          href={project.links.repository}
          rel="noreferrer"
          target="_blank"
        >
          View repository <ArrowUpRight size={16} />
        </a>
      </article>
    </div>
  )
}
