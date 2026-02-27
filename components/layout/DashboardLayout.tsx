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
import { UpgradeSessionRefresh } from '@/components/dashboard/UpgradeSessionRefresh';

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
  if (pathname !== '/dashboard') return null;
  return <CreatorTutorial forceShow={forceShow} />;
}

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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
    <div className="min-h-screen bg-[#F5F5F7] overflow-x-hidden">
      {/* Backdrop mobile quand la sidebar est ouverte */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="pl-0 md:pl-[68px] lg:pl-72 min-h-screen flex flex-col transition-[padding] duration-200">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-[calc(100vh-4rem)] flex flex-col pb-[72px] md:pb-0">
          <ErrorBoundary>
            <PageTransition className="flex-1 min-h-0 flex flex-col">
              <PaywallGate>{children}</PaywallGate>
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
      <Suspense fallback={null}>
        <DashboardTutorialGate />
        <CreatorTutorialGate />
        <UpgradeSessionRefresh />
      </Suspense>
      {/* Mobile bottom nav — only visible on small screens (below md) */}
      <MobileNav onMenuClick={() => setSidebarOpen(true)} />

    </div>
  );
}
