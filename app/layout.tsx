import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

import { TitleWink } from '@/components/motion/TitleWink'
import { WebGLActivationGate } from '@/components/motion/WebGLActivationGate'

import './globals.css'

const noScriptHeroStyles = `
  @media (prefers-reduced-motion: no-preference) {
    .hero-copy-release { padding-bottom: 0 !important; }
    .hero-copy {
      position: static !important;
      z-index: auto !important;
      top: auto !important;
      align-items: end !important;
      background: transparent !important;
    }
    .atlas-picture--hero img {
      position: static !important;
      top: auto !important;
      left: auto !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
    }
  }
  @media (min-width: 721px) and (prefers-reduced-motion: no-preference) {
    .hero-art { height: auto !important; }
    .atlas-picture--hero {
      height: auto !important;
      aspect-ratio: 16 / 8.7 !important;
    }
  }
`

export const metadata: Metadata = {
  metadataBase: new URL('https://bthaas.github.io'),
  title: 'Brett Haas',
  description:
    'Brett Haas is a software engineer building ambitious products across AI, web, mobile, and intelligent systems.',
  keywords: ['Brett Haas', 'Software Engineer', 'AI', 'React', 'Python', 'Portfolio'],
  authors: [{ name: 'Brett Haas', url: 'https://github.com/bthaas' }],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Brett Haas — Software Engineer',
    description: 'Intelligent systems, reliable products, and applied AI research.',
    url: '/',
    siteName: 'Brett Haas',
    images: [{ url: '/icarus-atlas/hero-social-1600.webp', width: 1600, height: 900 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brett Haas — Software Engineer',
    description: 'Intelligent systems, reliable products, and applied AI research.',
    images: ['/icarus-atlas/hero-social-1600.webp'],
  },
  icons: {
    icon: [{ url: '/original-wing-filled.png', type: 'image/png', sizes: '128x128' }],
    shortcut: '/original-wing-filled.png',
    apple: '/assets/wing-mark.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF8F4',
  colorScheme: 'light',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          as="image"
          type="image/avif"
          href="/icarus-atlas/hero-flight-1600.avif"
          imageSrcSet="/icarus-atlas/hero-flight-640.avif 640w, /icarus-atlas/hero-flight-768.avif 768w, /icarus-atlas/hero-flight-960.avif 960w, /icarus-atlas/hero-flight-1600.avif 1600w"
          imageSizes="(max-width: 720px) 100vw, calc(100vw - 64px)"
          fetchPriority="high"
        />
        <noscript>
          <style>{noScriptHeroStyles}</style>
        </noscript>
      </head>
      <body>
        {children}
        <WebGLActivationGate />
        <TitleWink />
        <Script src="/atlas.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
