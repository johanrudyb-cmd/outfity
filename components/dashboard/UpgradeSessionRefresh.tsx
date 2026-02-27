'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isPaidPlan } from '@/lib/plan-utils';
import { useToast } from '@/components/ui/toast';

/**
 * Détecte le retour de Stripe (?upgraded=true) :
 * 1. Déclenche update() → JWT recalculé depuis la DB (plan = 'creator')
 * 2. Attend que la session soit réellement à jour (plan === 'creator')
 * 3. Redirige vers /welcome-creator (page immersive d'activation)
 */
export function UpgradeSessionRefresh() {
    const { update } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const hasTriggered = useRef(false);
    const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const isUpgraded = searchParams.get('upgraded') === 'true';
        const isSubscribed = searchParams.get('subscribed') === 'true';

        if (!isUpgraded && !isSubscribed) return;
        if (hasTriggered.current) return;
        hasTriggered.current = true;

        console.log('[UpgradeSessionRefresh] Triggered for:', isUpgraded ? 'upgraded' : 'subscribed');

        // Affiche un toast de succès immédiat
        toast({
            title: "Paiement reçu !",
            message: "Activation de votre accès Créateur en cours...",
            type: 'success'
        });

        // Retire le param de l'URL immédiatement pour éviter les boucles si refresh manuel
        const url = new URL(window.location.href);
        url.searchParams.delete('upgraded');
        url.searchParams.delete('subscribed');
        window.history.replaceState({}, '', url.pathname + (url.search || ''));

        // Lance le premier refresh JWT avec un objet pour forcer la détection dans NextAuth v5
        update({ triggerUpdate: true });

        // Attend que la session reflète bien le changement de plan (max 10 secondes)
        let attempts = 0;
        checkInterval.current = setInterval(async () => {
            attempts++;

            // On appelle update() pour forcer NextAuth à relire le JWT depuis la DB
            const updated = await update({ refreshing: true });
            const plan = (updated?.user as any)?.plan;

            if (isPaidPlan(plan) || attempts >= 8) { // 8 attempts ~ 10s
                if (checkInterval.current) clearInterval(checkInterval.current);

                if (isPaidPlan(plan)) {
                    toast({
                        title: "Compte activé 🎉",
                        message: "Bienvenue dans l'équipe Créateur !",
                        type: 'success'
                    });
                    // On redirige vers la page d'accueil Créateur (page immersive)
                    router.replace('/welcome-creator');
                } else {
                    // Timeout : refresh simple de la page actuelle en dernier recours
                    router.refresh();
                }
            }
        }, 1200);

        return () => {
            if (checkInterval.current) clearInterval(checkInterval.current);
        };
    }, [searchParams, update, router, toast]);

    return null;
}
