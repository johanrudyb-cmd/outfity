import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Workaround for Windows spawn EPERM during Next 16 build worker fork
    webpackBuildWorker: false,
    // Keep child_process workers to avoid DataCloneError during static generation
    workerThreads: false,
    // Limit worker fan-out on Windows
    cpus: 1,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  compress: true, // Enable gzip/brotli compression
  poweredByHeader: false, // Remove X-Powered-By header
  // Explicit workspace root to avoid multi-lockfile warnings
  outputFileTracingRoot: path.resolve(process.cwd()),
  // Avoid bundling pdfkit at runtime to prevent ENOENT Helvetica.afm
  serverExternalPackages: ['pdfkit', 'nodemailer'],
  // Turbopack disabled in dev (--webpack) to avoid Windows endpoint write issues
  // turbopack: { root: path.resolve(process.cwd()) },
  images: {
    localPatterns: [
      // Autorise les sources proxifiées en local: /api/proxy-image?url=...
      { pathname: '/api/proxy-image' },
    ],
    remotePatterns: [
      // Infrastructure
      { protocol: 'https', hostname: 'd1yei2z3i6k35z.cloudfront.net' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.amazonaws.com' },

      // External scraped sources
      { protocol: 'https', hostname: '**.zalando.**' },
      { protocol: 'https', hostname: '**.asos.com' },
      { protocol: 'https', hostname: '**.zara.com' },
      { protocol: 'https', hostname: 'static.zara.net' },
      { protocol: 'https', hostname: '**.hm.com' },
      { protocol: 'https', hostname: 'lp2.hm.com' },
      { protocol: 'https', hostname: 'image.uniqlo.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.google.com' },
      { protocol: 'https', hostname: 'wsrv.nl' },

      // Auth avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },

      // Local development + misc
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.higgsfield.ai' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/apple-icon.webp' }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      {
        source: '/(.*)\.(ico|png|jpg|jpeg|webp|svg|woff|woff2|ttf|otf)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
