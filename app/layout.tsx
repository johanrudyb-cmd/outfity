export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SurplusModalProvider } from '@/components/usage/SurplusModalContext';

import { ErrorBoundary } from '@/components/error/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://outfity.fr';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const,
  themeColor: '#F5F5F7',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OUTFITY',
  },
  title: {
    default: 'CRÉE TA MARQUE DE VÊTEMENT DE A à Z | OUTFITY',
    template: '%s | OUTFITY',
  },
  description:
    'La plateforme n°1 pour créer sa marque de vêtement sans faire d\'erreurs. De la recherche de tendance au sourcing usine, on t\'accompagne de A à Z.',
  keywords: [
    'OUTFITY',
    'créer sa marque de vêtement',
    'lancer une marque de vêtement',
    'devenir créateur de mode',
    'sourcing usine textile',
    'data mode',
    'brand strategy mode',
    'streetwear business',
    'tech pack pro'
  ],
  authors: [{ name: 'OUTFITY', url: 'https://outfity.fr' }],
  creator: 'OUTFITY',
  publisher: 'OUTFITY',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.webp' },
      { url: '/apple-icon.webp', sizes: '180x180', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.webp', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'OUTFITY',
    title: 'CRÉE TA MARQUE DE VÊTEMENT DE A à Z | OUTFITY',
    description:
      'Ne lance pas ta marque au hasard. OUTFITY t\'accompagne de A à Z : veilles marché, sourcing usines et outils experts pour réussir ton lancement.',
    images: [
      {
        url: '/apple-icon.webp',
        width: 512,
        height: 512,
        alt: 'OUTFITY - Créer sa marque de vêtement',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRÉE TA MARQUE DE VÊTEMENT DE A à Z | OUTFITY',
    description:
      'Bâtis ta marque avec une vraie veille marché, des designs structurés et les meilleures usines mondiales. On t\'accompagne de A à Z.',
    images: ['/apple-icon.webp'],
    creator: '@outfity',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { Providers } from '@/components/providers/Providers';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { UpgradeSessionRefresh } from '@/components/dashboard/UpgradeSessionRefresh';
import { TrackingCleaner } from '@/components/layout/TrackingCleaner';
import { Suspense } from 'react';
import NextTopLoader from 'nextjs-toploader';
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="icon" type="image/png" href="/icon.webp" />
        <link rel="shortcut icon" href="/icon.webp" />
        <link rel="apple-touch-icon" href="/apple-icon.webp" />
      </head>
      <body className="font-sans antialiased min-h-screen safe-area-padding">
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "OUTFITY",
              "operatingSystem": "Web",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "29",
                "priceCurrency": "EUR"
              },
              "description": "La plateforme n°1 pour créer sa marque de vêtement de A à Z. Accédez aux datas du marché, au sourcing d'usines certifiées et à nos outils experts.",
              "url": "https://outfity.fr"
            }),
          }}
        />
        <NextTopLoader
          color="#00AEEF"
          showSpinner={false}
          shadow="0 0 10px #00AEEF,0 0 5px #00AEEF"
          height={3}
          crawl={true}
          easing="ease"
          speed={200}
        />
        <ErrorBoundary>
          <Providers>
            <SurplusModalProvider>{children}</SurplusModalProvider>
            <Suspense fallback={null}>
              <UpgradeSessionRefresh />
            </Suspense>
            <Suspense fallback={null}>
              <TrackingCleaner />
            </Suspense>
            <ScrollToTop />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
