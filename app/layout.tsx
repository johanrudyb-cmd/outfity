import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { AppClientShell } from '@/components/layout/AppClientShell';

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
    default: 'Lance ta Marque de Vêtements sans te Ruiner | OUTFITY',
    template: '%s | OUTFITY',
  },
  description:
    'La plateforme complète pour lancer ta marque avec un budget réaliste. Valide la demande avec une waitlist, génère tes designs et contacte les meilleures usines directement.',
  keywords: [
    'OUTFITY',
    'créer sa marque de vêtement',
    'lancer une marque de vêtement',
    'fournisseur vêtement',
    'usine de production vêtement',
    'tech pack vêtement',
    'waitlist lancement',
    'business mode',
    'streetwear marque'
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
    title: 'Lance ta Marque de Vêtements sans te Ruiner | OUTFITY',
    description:
      'Ne lance pas ta marque à l\'aveugle. OUTFITY t\'apporte l\'infrastructure complète : de ta communauté avant lancement jusqu\'à la mise en relation avec des usines validées.',
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
    title: 'Lance ta Marque de Vêtements sans te Ruiner | OUTFITY',
    description:
      'Crée ta communauté, valide tes designs, contacte les usines et lance ton premier drop avec un budget et des objectifs réalistes. Tout est sur OUTFITY.',
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
        <ErrorBoundary>
          <AppClientShell>{children}</AppClientShell>
        </ErrorBoundary>
      </body>
    </html>
  );
}
