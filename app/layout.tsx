import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

import { PageTransitionProvider } from '@/components/motion/PageTransitionProvider'
import { PersistentAtlasMotionEffects } from '@/components/motion/PersistentAtlasMotionEffects'
import { WebGLActivationGate } from '@/components/motion/WebGLActivationGate'
import { getBootLoaderScript } from '@/lib/boot-loader'
import { SITE_DESCRIPTION, SITE_URL } from '@/lib/site-config'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Brett Haas',
  description: SITE_DESCRIPTION,
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getBootLoaderScript() }} />
      </head>
      <body>
        <PageTransitionProvider>
          <PersistentAtlasMotionEffects />
          {children}
        </PageTransitionProvider>
        <WebGLActivationGate />
        <Script src="/atlas.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
