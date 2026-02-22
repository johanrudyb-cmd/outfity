'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DashboardTutorial } from '@/components/dashboard/DashboardTutorial';
import { PageTransition } from './PageTransition';
import { PaywallGate } from '@/components/paywall/PaywallGate';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ChatAssistant } from './ChatAssistant';
import { MobileNav } from './MobileNav';

function DashboardTutorialGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showTutorial = pathname === '/dashboard' && searchParams.get('tutorial') === '1';
  return showTutorial ? <DashboardTutorial /> : null;
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
      <div className="pl-0 lg:pl-72 min-h-screen flex flex-col transition-[padding] duration-200">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 min-h-[calc(100vh-4rem)] flex flex-col">
          <ErrorBoundary>
            <PageTransition className="flex-1 min-h-0 flex flex-col">
              <PaywallGate>{children}</PaywallGate>
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
      <Suspense fallback={null}>
        <DashboardTutorialGate />
      </Suspense>
      <MobileNav onMenuClick={() => setSidebarOpen(true)} />
      <ChatAssistant />
    </div>
  );
}
