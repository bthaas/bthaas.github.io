import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: '/static-v1',
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
}

export default nextConfig
