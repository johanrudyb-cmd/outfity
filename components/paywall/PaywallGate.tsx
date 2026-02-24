'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Lock, Sparkles, ArrowLeft } from 'lucide-react';

/** Chemins ou préfixes paywalled (tous les autres sont gratuits) */
const PAYWALLED_PATHS: { path: string; exact?: boolean }[] = [
  { path: '/design-studio' },
  { path: '/ugc' },
  { path: '/brands/analyze' },
];

function isPaywalledPath(pathname: string): boolean {
  // Le Launch Map est accessible en mode découverte (Overview + phases 0, 1, 2, 4)
  // On laisse passer l'overview et on bloque sélectivement les phases premium
  if (pathname === '/launch-map' || pathname === '/launch-map/') return false;

  if (pathname.startsWith('/launch-map/phase/')) {
    const phaseId = parseInt(pathname.split('/').pop() || '', 10);
    // Phases débloquées : 0 (Identité), 1 (Stratégie), 2 (Mockup), 4 (Sourcing)
    if ([0, 1, 2, 4].includes(phaseId)) return false;
    // Tout autre phase (3: Tech Pack, 5: Shopify) est verrouillée
    return true;
  }

  // Sourcing Hub (Outil direct ou via Launch Map)
  if (pathname === '/launch-map/sourcing' || pathname === '/sourcing' || pathname.startsWith('/sourcing/')) return false;

  // Tech Packs (Livrables premium)
  if (pathname === '/launch-map/tech-packs' || pathname.startsWith('/launch-map/tech-packs/')) return true;

  // Autres outils du Launch Map (Calendrier, Formation...) sont gratuits par défaut
  if (pathname.startsWith('/launch-map/')) return false;

  for (const { path, exact } of PAYWALLED_PATHS) {
    if (exact ? pathname === path : pathname === path || pathname.startsWith(path + '/')) return true;
  }
  return false;
}

export function PaywallGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const loading = status === 'loading';
  const [showPaywall, setShowPaywall] = useState(false);


  useEffect(() => {
    if (loading) return;
    const isFree = user?.plan === 'free';
    const isPathPaywalled = isPaywalledPath(pathname || '');
    setShowPaywall(!!(isFree && isPathPaywalled));
  }, [loading, user?.plan, pathname]);

  // Toujours la même structure racine pour éviter hydration mismatch
  if (showPaywall) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-8 py-16 bg-[#F5F5F7]">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#007AFF]" />
          </div>
          <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">
            Fonctionnalité réservée au plan Créateur
          </h2>
          <p className="text-[#6e6e73] text-lg leading-relaxed">
            Profitez de l'offre de lancement à 29€ le 1er mois (3 jours d'essai gratuit) pour débloquer tous les outils : stratégie, designs, sourcing et plus.
          </p>

          <div className="flex flex-col gap-3 pt-6">
            <Link
              href="/auth/choose-plan"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#007AFF] text-white rounded-full font-bold hover:bg-[#0056CC] transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              Passer au plan Créateur
            </Link>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#1D1D1F] border border-black/5 rounded-full font-bold hover:bg-[#F5F5F7] transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              Retourner en arrière
            </button>
          </div>

          <p className="text-sm text-[#6e6e73] pt-4">
            Annulable à tout moment
          </p>
        </div>
      </div>
    );
  }
  return <div className="min-w-0 flex-1 flex flex-col min-h-0">{children}</div>;
}
