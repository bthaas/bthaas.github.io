'use client'

import { useEffect } from 'react'

const WINK_TITLE = 'Come back — the atlas is still open.'

export function TitleWink() {
  useEffect(() => {
    let pageTitle = document.title
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pageTitle = document.title === WINK_TITLE ? pageTitle : document.title
        document.title = WINK_TITLE
      } else {
        document.title = pageTitle
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return null
}
