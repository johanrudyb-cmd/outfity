import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SurplusModalProvider } from '@/components/usage/SurplusModalContext';

import { ErrorBoundary } from '@/components/error/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
    default: 'Créer sa marque de vêtement avec la Data des géants | OUTFITY',
    template: '%s | OUTFITY',
  },
  description:
    'La plateforme n°1 pour créer sa marque de vêtement. Accédez aux datas du marché, au sourcing d\'usines certifiées et à nos outils experts pour lancer une collection rentable.',
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
      { url: '/icon.png' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'OUTFITY',
    title: 'La plateforme n°1 pour créer sa marque de vêtement | OUTFITY',
    description:
      'Ne lancez pas votre marque à l\'aveugle. Utilisez OUTFITY pour concevoir, sourcer et lancer une collection premium structurée pour la réussite.',
    images: [
      {
        url: '/apple-icon.png',
        width: 512,
        height: 512,
        alt: 'OUTFITY - Créer sa marque de vêtement',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La plateforme n°1 pour créer sa marque de vêtement | OUTFITY',
    description:
      'Bâtissez votre marque avec une vraie veille marché, des designs structurés et les meilleures usines mondiales.',
    images: ['/apple-icon.png'],
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
import { IOSInstallPrompt } from '@/components/layout/IOSInstallPrompt';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

// export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="shortcut icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script
          type="application/ld+json"
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
              "description": "La plateforme n°1 pour créer sa marque de vêtement. Accédez aux datas du marché, au sourcing d'usines certifiées et à nos outils experts.",
              "url": "https://outfity.fr"
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen safe-area-padding">
        <ErrorBoundary>
          <Providers>
            <SurplusModalProvider>{children}</SurplusModalProvider>
            <IOSInstallPrompt />
            <ScrollToTop />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
