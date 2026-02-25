'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Composant invisible.
 * Si l'URL contient ?upgraded=true (retour après paiement Stripe),
 * on force immédiatement le refresh JWT pour que le plan 'creator'
 * soit visible sans déconnexion/reconnexion.
 */
export function UpgradeSessionRefresh() {
    const { update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('upgraded') !== 'true') return;

        // Refresh la session NextAuth pour relire le plan depuis la DB
        update({ plan: 'creator' }).then(() => {
            // Retire le paramètre ?upgraded=true de l'URL sans recharger la page
            const url = new URL(window.location.href);
            url.searchParams.delete('upgraded');
            router.replace(url.pathname + (url.search || ''));
        });
    }, [searchParams, update, router]);

    return null;
}
