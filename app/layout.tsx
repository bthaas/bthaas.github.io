import type { Metadata, Viewport } from 'next'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://bthaas.github.io'),
  title: 'Brett Haas — Software Engineer',
  description:
    'Brett Haas is a software engineer building ambitious products across AI, web, mobile, and intelligent systems.',
  keywords: ['Brett Haas', 'Software Engineer', 'AI', 'React', 'Python', 'Portfolio'],
  authors: [{ name: 'Brett Haas', url: 'https://github.com/bthaas' }],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Brett Haas — Software Engineer',
    description: 'Building things ambitious enough to be worth the risk.',
    url: '/',
    siteName: 'Brett Haas',
    images: [{ url: '/og-image.jpg', width: 1440, height: 900 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brett Haas — Software Engineer',
    description: 'Building things ambitious enough to be worth the risk.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png', sizes: '64x64' }],
    shortcut: '/favicon.png',
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
      <body>{children}</body>
    </html>
  )
}
