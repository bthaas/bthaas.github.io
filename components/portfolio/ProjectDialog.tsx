'use client'

import { ArrowUpRight, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'

import type { Project } from '@/content/site-content'

interface ProjectDialogProps {
  readonly project: Project
  readonly onClose: () => void
}

export default function ProjectDialog({ project, onClose }: ProjectDialogProps) {
  const reducedMotion = useReducedMotion()

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
    <motion.div
      className="dialog-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseDown={onClose}
    >
      <motion.article
        aria-label={project.name}
        aria-modal="true"
        className="project-dialog"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 44, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        transition={{ type: 'spring', stiffness: 210, damping: 24, mass: 0.82 }}
      >
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
      </motion.article>
    </motion.div>
  )
}
