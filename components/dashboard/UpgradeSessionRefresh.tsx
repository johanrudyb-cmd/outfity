'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Détecte le retour de Stripe (?upgraded=true) :
 * 1. Déclenche update() → JWT recalculé depuis la DB (plan = 'creator')
 * 2. Attend que la session soit réellement à jour (plan === 'creator')
 * 3. Redirige vers /welcome-creator (page immersive d'activation)
 */
export function UpgradeSessionRefresh() {
    const { update, data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasTriggered = useRef(false);
    const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (searchParams.get('upgraded') !== 'true') return;
        if (hasTriggered.current) return;
        hasTriggered.current = true;

        // Retire le param de l'URL immédiatement
        const url = new URL(window.location.href);
        url.searchParams.delete('upgraded');
        router.replace(url.pathname + (url.search || ''));

        // Lance le refresh JWT → le JWT callback relit la DB
        update();

        // Attend que la session reflète bien 'creator' (max 8 secondes)
        let attempts = 0;
        checkInterval.current = setInterval(async () => {
            attempts++;
            // Reforce le refresh à chaque tentative pour être sûr
            const updated = await update();
            if ((updated?.user as any)?.plan === 'creator' || attempts >= 8) {
                if (checkInterval.current) clearInterval(checkInterval.current);
                router.push('/welcome-creator');
            }
        }, 1000);

        return () => {
            if (checkInterval.current) clearInterval(checkInterval.current);
        };
    }, [searchParams, update, router]);

    return null;
}
