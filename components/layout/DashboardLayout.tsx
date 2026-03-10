'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DashboardTutorial } from '@/components/dashboard/DashboardTutorial';
import { CreatorTutorial } from '@/components/dashboard/CreatorTutorial';
import { PageTransition } from './PageTransition';
import { PaywallGate } from '@/components/paywall/PaywallGate';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

import { MobileNav } from './MobileNav';
import { TrackingCleaner } from './TrackingCleaner';
import { ErrorToastHandler } from './ErrorToastHandler';
import useSWR from 'swr';
import { isFreePlan } from '@/lib/plan-utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function DashboardTutorialGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const forceShow = searchParams.get('tutorial') === '1';

  // Le composant DashboardTutorial gère lui-même sa visibilité via localStorage
  // On le monte sur toutes les pages du dashboard pour capter le flag 'show_tutorial_next'
  if (pathname !== '/dashboard') return null;
  return <DashboardTutorial forceShow={forceShow} />;
}

function CreatorTutorialGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const forceShow = searchParams.get('creator_tour') === '1';

  const { data: userPlanData } = useSWR('/api/user/plan', fetcher);

  if (pathname !== '/dashboard') return null;
  if (!forceShow && (!userPlanData || isFreePlan(userPlanData.plan))) return null;

  return <CreatorTutorial forceShow={forceShow} />;
}

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Préchargement fantôme (Silent Prefetch) pour SWR
  useEffect(() => {
    import('swr').then(({ preload }) => {
      preload('/api/user/plan', fetcher);
      preload('/api/launch-map/progress', fetcher);
      preload('/api/brands/current', fetcher);
    });
  }, []);

  // Fermer la sidebar sur changement de route (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Bloquer le scroll du body quand le menu drawer est ouvert (mobile/tablette)
  useEffect(() => {
    if (sidebarOpen && typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] flex relative">
      {/* Backdrop mobile quand la sidebar est ouverte */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-[60] bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 pl-0 md:pl-[68px] lg:pl-72 transition-[padding] duration-300 ease-apple overflow-x-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 relative flex flex-col pb-8">
          <ErrorBoundary>
            <PageTransition className="flex-1 flex flex-col">
              <PaywallGate>{children}</PaywallGate>
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
      <Suspense fallback={null}>
        <DashboardTutorialGate />
        <CreatorTutorialGate />
        <TrackingCleaner />
        <ErrorToastHandler />
      </Suspense>
    </div>
  );
}
