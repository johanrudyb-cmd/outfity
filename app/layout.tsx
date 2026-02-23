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
    'La solution n°1 pour créer sa marque de vêtement en 2026. Accédez aux tendances mondiales, au sourcing d\'usines certifiées et à une stratégie retail automatisée par IA. Propulsé par BIANGORY.',
  keywords: [
    'OUTFITY',
    'BIANGORY',
    'créer sa marque de vêtement',
    'lancer une marque de mode',
    'devenir créateur de mode',
    'sourcing usine textile',
    'intelligence artificielle mode',
    'brand strategy mode',
    'streetwear business'
  ],
  authors: [{ name: 'BIANGORY', url: 'https://outfity.fr' }],
  creator: 'BIANGORY',
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
    title: 'Créer sa marque de vêtement avec la Data des géants | OUTFITY',
    description:
      'Ne lancez pas votre marque de vêtement à l\'aveugle. Utilisez la data d\'OUTFITY pour bâtir une collection rentable avec les meilleures usines mondiales.',
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
    title: 'Créer sa marque de vêtement : La méthode OUTFITY',
    description:
      'Bâtissez votre marque de mode avec les outils des leaders mondiaux. Sourcing, Trends, IA.',
    images: ['/apple-icon.png'],
    creator: '@biangory',
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
      </head>
      <body className="font-sans antialiased min-h-screen safe-area-padding">
        <ErrorBoundary>
          <Providers>
            <SurplusModalProvider>{children}</SurplusModalProvider>
            <IOSInstallPrompt />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
