'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Crown, X, Sparkles } from 'lucide-react';

/**
 * Composant invisible (sauf Toast).
 * Si l'URL contient ?upgraded=true (retour après paiement Stripe),
 * on force le refresh JWT et on affiche une bannière de confirmation.
 */
export function UpgradeSessionRefresh() {
    const { update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (searchParams.get('upgraded') !== 'true') return;

        // Refresh la session NextAuth pour relire le plan depuis la DB
        update({ plan: 'creator' }).then(() => {
            // Retire le paramètre ?upgraded=true de l'URL sans recharger
            const url = new URL(window.location.href);
            url.searchParams.delete('upgraded');
            router.replace(url.pathname + (url.search || ''));
            // Affiche le toast de confirmation
            setShowToast(true);
            setTimeout(() => setShowToast(false), 6000);
        });
    }, [searchParams, update, router]);

    if (!showToast) return null;

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-500"
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center gap-4 bg-[#1D1D1F] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-black/30 max-w-sm w-[calc(100vw-2rem)]">
                {/* Icône */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Crown className="w-5 h-5 text-white" />
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold flex items-center gap-1.5">
                        Plan Créateur activé <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    </p>
                    <p className="text-xs text-white/60 mt-0.5 leading-snug">
                        Toutes les fonctionnalités sont débloquées. Bienvenue dans l&apos;équipe !
                    </p>
                </div>

                {/* Fermer */}
                <button
                    onClick={() => setShowToast(false)}
                    className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Fermer"
                >
                    <X className="w-4 h-4 text-white/50" />
                </button>
            </div>

            {/* Barre de progression */}
            <div className="mt-1.5 mx-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#007AFF] rounded-full"
                    style={{ animation: 'toast-progress 6s linear forwards' }}
                />
            </div>

            <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
}
