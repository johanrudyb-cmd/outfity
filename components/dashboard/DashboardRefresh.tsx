'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function DashboardRefresh({ autoRunOnce = false }: { autoRunOnce?: boolean }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (autoRunOnce) {
      router.refresh();
    }
  }, [autoRunOnce, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    // Attendre un peu pour que le refresh se termine
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto-refresh toutes les 5 minutes (seulement si page visible)
  // Augmenté de 60s à 5min pour réduire la charge serveur
  useEffect(() => {
    // Ne pas auto-refresh si la page n'est pas visible (onglet inactif)
    if (typeof document === 'undefined') return;

    let intervalId: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée : arrêter le refresh
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        // Page visible : démarrer le refresh
        if (!intervalId) {
          intervalId = setInterval(() => {
            router.refresh();
          }, 300000); // 5 minutes (au lieu de 60 secondes)
        }
      }
    };

    // Démarrer seulement si page visible
    if (!document.hidden) {
      intervalId = setInterval(() => {
        router.refresh();
      }, 300000); // 5 minutes
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="uppercase tracking-widest text-xs font-normal"
    >
      {isRefreshing ? 'Actualisation...' : 'Actualiser'}
    </Button>
  );
}
