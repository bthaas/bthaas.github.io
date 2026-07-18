'use client'

import { useEffect } from 'react'

export const WEBGL_ACTIVATED_ATTRIBUTE = 'data-atlas-webgl-activated'
export const WEBGL_ACTIVATION_EVENT = 'atlas:activate-webgl'

export function WebGLActivationGate() {
  useEffect(() => {
    const root = document.documentElement
    if (root.hasAttribute(WEBGL_ACTIVATED_ATTRIBUTE)) return
    const passive: AddEventListenerOptions = { passive: true }

    const removeListeners = () => {
      window.removeEventListener('pointermove', activate)
      window.removeEventListener('wheel', activate)
      window.removeEventListener('touchstart', activate)
      window.removeEventListener('keydown', activate)
    }
    const activate = () => {
      if (
        root.hasAttribute(WEBGL_ACTIVATED_ATTRIBUTE)
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) return
      root.setAttribute(WEBGL_ACTIVATED_ATTRIBUTE, '')
      window.dispatchEvent(new CustomEvent(WEBGL_ACTIVATION_EVENT))
      removeListeners()
    }

    window.addEventListener('pointermove', activate, passive)
    window.addEventListener('wheel', activate, passive)
    window.addEventListener('touchstart', activate, passive)
    window.addEventListener('keydown', activate)
    return removeListeners
  }, [])

  return null
}
