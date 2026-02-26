'use client';

import { useState, useEffect } from 'react';

// Fonction utilitaire pour convertir la clé publique VAPID (base64) en Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function useWebPush() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Check if already subscribed
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    setIsSubscribed(!!sub);
                });
            });
        }
    }, []);

    const subscribe = async () => {
        if (!isSupported) return false;
        setLoading(true);

        try {
            // 1. Demander la permission
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result !== 'granted') {
                throw new Error('Permission denied');
            }

            // 2. Enregistrer le Service Worker s'il ne l'est pas
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready; // Attendre qu'il soit actif

            // 3. S'abonner au PushManager
            const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!VAPID_PUBLIC_KEY) {
                throw new Error('Missing VAPID PUBLIC KEY in env variables');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // 4. Envoyer la subscription au backend (API) pour la sauvegarder dans la DB
            await fetch('/api/web-push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            setIsSubscribed(true);
            return true;

        } catch (error) {
            console.error('Erreur lors de la souscription Web Push:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const testPush = async () => {
        await fetch('/api/web-push/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Test de Connexion 🚀",
                message: "OUTFITY Push Actions configurées. Prêt pour les notifications !"
            })
        });
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        loading,
        subscribe,
        testPush
    };
}
