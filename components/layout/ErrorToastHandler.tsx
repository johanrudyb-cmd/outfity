'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Capture les erreurs passées en query param (ex: ?error=not_affiliate)
 * Affiche un toast informatif et nettoie l'URL
 */
export function ErrorToastHandler() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');

        if (error === 'not_affiliate') {
            toast.error("Accès restreint", {
                description: "Vous n'avez pas encore activé votre accès partenaire ou votre profil est en attente.",
                duration: 5000,
            });

            // Nettoyer l'URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('error');
            const query = params.toString();
            const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
            window.history.replaceState(null, '', cleanUrl);
        }
    }, [searchParams]);

    return null;
}
