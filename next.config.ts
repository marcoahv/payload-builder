import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Remote images are allowed only from the bucket this project is configured
// against. With S3_PUBLIC_URL unset, media is served locally through Payload's
// own route instead — covered by localPatterns below — so the list is empty
// rather than pointing at someone else's CDN.
const publicMediaOrigin = process.env.S3_PUBLIC_URL?.replace(/\/+$/, '')
const remotePatterns = publicMediaOrigin ? [new URL(`${publicMediaOrigin}/**`)] : []

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
