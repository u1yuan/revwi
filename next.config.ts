import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['geist'],
  outputFileTracingRoot: import.meta.dirname,
}

export default nextConfig
