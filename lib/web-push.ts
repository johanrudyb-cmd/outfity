import webpush from 'web-push';
import { prisma } from './prisma';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            'mailto:contact@outfity.art', // A changer selon l'admin
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
    } catch (error) {
        console.warn('Erreur lors de l\'initialisation web-push (Vapid keys potentiellement invalides):', error);
    }
}

export interface PushMessage {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
}

/**
 * Envoie une notification web-push à un utilisateur spécifique
 */
export async function sendWebPushNotification(userId: string, message: PushMessage) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn("Les clés VAPID ne sont pas configurées. Notification Push ignorée.");
        return { success: false, error: 'VAPID keys missing' };
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        if (!subscriptions || subscriptions.length === 0) {
            return { success: false, error: 'No subscription found for user' };
        }

        const payload = JSON.stringify({
            title: message.title,
            body: message.body,
            url: message.url || '/dashboard',
            icon: message.icon || '/icon.png',
            badge: message.badge || '/icon.png'
        });

        const results = await Promise.allSettled(
            subscriptions.map(sub =>
                webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }, payload).catch(async (e: any) => {
                    if (e.statusCode === 404 || e.statusCode === 410) {
                        // Subscription expired or unsubscribed
                        await prisma.pushSubscription.delete({ where: { id: sub.id } });
                    }
                    throw e;
                })
            )
        );

        const sentCount = results.filter(r => r.status === 'fulfilled').length;
        return { success: sentCount > 0, sentCount, totalSubs: subscriptions.length };
    } catch (error) {
        console.error('Erreur sendWebPushNotification:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Envoie une notification web-push à TOUS les utilisateurs abonnés (Broadcast)
 */
export async function broadcastWebPushNotification(message: PushMessage) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn("Les clés VAPID ne sont pas configurées. Broadcast Push ignoré.");
        return { success: false, error: 'VAPID keys missing' };
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany();

        if (!subscriptions || subscriptions.length === 0) {
            return { success: false, error: 'No subscriptions found in DB' };
        }

        const payload = JSON.stringify({
            title: message.title,
            body: message.body,
            url: message.url || '/dashboard',
            icon: message.icon || '/icon.png',
            badge: message.badge || '/icon.png'
        });

        const results = await Promise.allSettled(
            subscriptions.map(sub =>
                webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                }, payload).catch(async (e: any) => {
                    if (e.statusCode === 404 || e.statusCode === 410) {
                        try {
                            await prisma.pushSubscription.delete({ where: { id: sub.id } });
                        } catch (err) {
                            console.error('Erreur lors de la suppression de la souscription:', err);
                        }
                    }
                    throw e;
                })
            )
        );

        const sentCount = results.filter(r => r.status === 'fulfilled').length;
        return { success: sentCount > 0, sentCount, totalSubs: subscriptions.length };
    } catch (error) {
        console.error('Erreur broadcastWebPushNotification:', error);
        return { success: false, error: String(error) };
    }
}
