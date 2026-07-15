import type { Metadata, Viewport } from 'next'

import './globals.css'

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
          imageSrcSet="/icarus-atlas/hero-flight-960.avif 960w, /icarus-atlas/hero-flight-1600.avif 1600w"
          imageSizes="(max-width: 720px) 100vw, calc(100vw - 64px)"
          fetchPriority="high"
        />
        <script src="/atlas.js" defer />
      </head>
      <body>{children}</body>
    </html>
  )
}
