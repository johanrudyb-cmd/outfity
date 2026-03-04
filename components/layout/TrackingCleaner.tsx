'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

/**
 * Nettoie discrètement l'URL des paramètres de tracking après capture
 * Transforme ?v=code en URL propre pour l'utilisateur
 */
export function TrackingCleaner() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const v = searchParams.get('v');
        const ref = searchParams.get('ref');

        if (v || ref) {
            const code = v || ref;

            // Log le clic côté serveur
            fetch('/api/auth/partners/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    path: pathname,
                    resourceId: searchParams.get('resource')
                })
            }).catch(err => console.error('Click logging failed:', err));

            // Créer une nouvelle URL sans les paramètres de tracking
            const params = new URLSearchParams(searchParams.toString());
            params.delete('v');
            params.delete('ref');

            const query = params.toString();
            const cleanUrl = `${pathname}${query ? `?${query}` : ''}`;

            // Remplacer l'URL sans recharger la page (silencieux)
            window.history.replaceState(null, '', cleanUrl);
        }
    }, [searchParams, pathname]);

    return null;
}
