import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true, // Activer la compression Gzip/Brotli
  poweredByHeader: false, // Supprimer l'en-tête X-Powered-By (micro perf + sécu)
  // Définir explicitement la racine du workspace pour éviter les avertissements sur les lockfiles multiples
  outputFileTracingRoot: path.resolve(process.cwd()),
  // Ne pas bundler puppeteer / pdfkit (résolution depuis node_modules au runtime pour éviter ENOENT Helvetica.afm)
  serverExternalPackages: ['puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth', 'pdfkit', 'nodemailer'],
  // Désactiver le tracing des fichiers de sortie (évite le scan récursif de node_modules, très gourmand en RAM)
  outputFileTracing: false,
  // Turbopack désactivé en dev (--webpack) pour éviter "Failed to write app endpoint" sur Windows
  // turbopack: { root: path.resolve(process.cwd()) },
  // Configuration stricte pour sécurité et performance cache
  images: {
    remotePatterns: [
      // Infrastructure
      { protocol: 'https', hostname: 'd1yei2z3i6k35z.cloudfront.net' }, // CDN Cloudfront (Higgsfield ?)
      { protocol: 'https', hostname: '**.supabase.co' }, // Supabase Storage
      { protocol: 'https', hostname: '**.amazonaws.com' }, // S3 AWS

      // Sources externes scrapées (Zalando, ASOS, etc.)
      { protocol: 'https', hostname: '**.zalando.**' },
      { protocol: 'https', hostname: '**.asos.com' },
      { protocol: 'https', hostname: '**.zara.com' },
      { protocol: 'https', hostname: 'static.zara.net' },
      { protocol: 'https', hostname: '**.hm.com' },
      { protocol: 'https', hostname: 'lp2.hm.com' },
      { protocol: 'https', hostname: 'image.uniqlo.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.google.com' }, // Pour les favicons via google.com/s2/favicons

      // Authentification (Avatars)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }, // GitHub

      // Développement local
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.higgsfield.ai' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/apple-icon.png' }];
  },
  // Headers de sécurité
  async headers() {
    return [
      {
        // Headers de sécurité pour toutes les pages
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
        // Cache agressif pour les assets statiques (images, fonts, JS, CSS)
        source: '/(.*)\.(ico|png|jpg|jpeg|webp|svg|woff|woff2|ttf|otf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
