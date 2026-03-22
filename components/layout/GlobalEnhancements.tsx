'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const NextTopLoader = dynamic(() => import('nextjs-toploader'), { ssr: false });
const ScrollToTop = dynamic(
  () => import('@/components/layout/ScrollToTop').then((mod) => mod.ScrollToTop),
  { ssr: false }
);
const UpgradeSessionRefresh = dynamic(
  () => import('@/components/dashboard/UpgradeSessionRefresh').then((mod) => mod.UpgradeSessionRefresh),
  { ssr: false }
);
const TrackingCleaner = dynamic(
  () => import('@/components/layout/TrackingCleaner').then((mod) => mod.TrackingCleaner),
  { ssr: false }
);

const APP_ROUTE_PREFIXES = [
  '/admin',
  '/brands',
  '/calculator',
  '/content-creation',
  '/dashboard',
  '/design-studio',
  '/designs',
  '/launch-map',
  '/notifications',
  '/onboarding',
  '/settings',
  '/share',
  '/sourcing',
  '/spy',
  '/trends',
  '/ugc',
  '/usage',
  '/welcome-creator',
];

const PUBLIC_SCROLL_ROUTES = [
  '/',
  '/academy',
  '/auth/signin',
  '/auth/signup',
  '/blog',
  '/communaute',
  '/contact',
  '/legal',
  '/partners',
  '/pricing',
];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`)));
}

export function GlobalEnhancements() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showTopLoader = matchesRoute(pathname, APP_ROUTE_PREFIXES);
  const showScrollToTop = matchesRoute(pathname, PUBLIC_SCROLL_ROUTES);
  const hasUpgradeParams = searchParams.get('upgraded') === 'true' || searchParams.get('subscribed') === 'true';
  const hasTrackingParams = searchParams.has('v') || searchParams.has('ref');

  return (
    <>
      {showTopLoader ? (
        <NextTopLoader
          color="#00AEEF"
          showSpinner={false}
          shadow="0 0 10px #00AEEF,0 0 5px #00AEEF"
          height={3}
          crawl={true}
          easing="ease"
          speed={200}
        />
      ) : null}

      {showScrollToTop ? <ScrollToTop /> : null}

      {hasUpgradeParams ? (
        <Suspense fallback={null}>
          <UpgradeSessionRefresh />
        </Suspense>
      ) : null}

      {hasTrackingParams ? (
        <Suspense fallback={null}>
          <TrackingCleaner />
        </Suspense>
      ) : null}
    </>
  );
}
