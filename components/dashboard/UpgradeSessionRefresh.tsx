'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Crown, X, Sparkles } from 'lucide-react';

/**
 * Composant invisible (sauf Toast si onboarding déjà fait).
 * Détecte le retour de Stripe (?upgraded=true) :
 * - Refresh le JWT session → plan = 'creator'
 * - Redirige vers /welcome-creator (page immersive d'activation)
 */
export function UpgradeSessionRefresh() {
    const { update, data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (searchParams.get('upgraded') !== 'true') return;

        // Retire le param de l'URL immédiatement
        const url = new URL(window.location.href);
        url.searchParams.delete('upgraded');
        router.replace(url.pathname + (url.search || ''));

        // Refresh la session NextAuth pour obtenir plan='creator'
        update({ plan: 'creator' }).then(() => {
            // Redirige vers la page de bienvenue Creator
            router.push('/welcome-creator');
        });
    }, [searchParams, update, router]);

    // Toast fallback (si la page welcome-creator échoue, ou usage direct)
    if (!showToast) return null;

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-500"
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center gap-4 bg-[#1D1D1F] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-black/30 max-w-sm w-[calc(100vw-2rem)]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold flex items-center gap-1.5">
                        Plan Créateur activé <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    </p>
                    <p className="text-xs text-white/60 mt-0.5 leading-snug">
                        Toutes les fonctionnalités sont débloquées. Bienvenue dans l&apos;équipe !
                    </p>
                </div>
                <button
                    onClick={() => setShowToast(false)}
                    className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                    aria-label="Fermer"
                >
                    <X className="w-4 h-4 text-white/50" />
                </button>
            </div>
        </div>
    );
}
