import webpush from 'web-push';
import { prisma } from './prisma';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const hasVapidKeys = Boolean(VAPID_PUBLIC_KEY) && Boolean(VAPID_PRIVATE_KEY);

let webPushReady = false;
let webPushInitialized = false;

function decodeBase64Url(input: string): Buffer | null {
  try {
    return Buffer.from(input, 'base64url');
  } catch {
    return null;
  }
}

function isValidVapidKeyPair(publicKey: string, privateKey: string): boolean {
  const decodedPublic = decodeBase64Url(publicKey);
  const decodedPrivate = decodeBase64Url(privateKey);

  if (!decodedPublic || !decodedPrivate) {
    return false;
  }

  // VAPID P-256 keys: public = 65 bytes (uncompressed), private = 32 bytes.
  return decodedPublic.length === 65 && decodedPrivate.length === 32;
}

function ensureWebPushReady(): boolean {
  if (webPushInitialized) {
    return webPushReady;
  }

  webPushInitialized = true;

  if (!hasVapidKeys) {
    return false;
  }

  if (!isValidVapidKeyPair(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)) {
    console.warn('Invalid VAPID keys (format/length). Web push notifications disabled.');
    return false;
  }

  try {
    webpush.setVapidDetails('mailto:contact@outfity.art', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    webPushReady = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to initialize web-push: ${message}`);
  }

  return webPushReady;
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

export async function sendWebPushNotification(userId: string, message: PushMessage) {
  if (!ensureWebPushReady()) {
    console.warn('Missing or invalid VAPID keys. Push notification skipped.');
    return { success: false, error: 'VAPID keys missing' };
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions || subscriptions.length === 0) {
      return { success: false, error: 'No subscription found for user' };
    }

    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      url: message.url || '/dashboard',
      icon: message.icon || '/icon.png',
      badge: message.badge || '/icon.png',
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          .catch(async (error: any) => {
            if (error.statusCode === 404 || error.statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
            throw error;
          })
      )
    );

    const sentCount = results.filter((result) => result.status === 'fulfilled').length;
    return { success: sentCount > 0, sentCount, totalSubs: subscriptions.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`sendWebPushNotification failed: ${message}`);
    return { success: false, error: message };
  }
}

export async function broadcastWebPushNotification(message: PushMessage) {
  if (!ensureWebPushReady()) {
    console.warn('Missing or invalid VAPID keys. Broadcast push skipped.');
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
      badge: message.badge || '/icon.png',
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          .catch(async (error: any) => {
            if (error.statusCode === 404 || error.statusCode === 410) {
              try {
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
              } catch (deleteError) {
                const deleteMessage =
                  deleteError instanceof Error ? deleteError.message : String(deleteError);
                console.error(`Failed to delete expired push subscription: ${deleteMessage}`);
              }
            }
            throw error;
          })
      )
    );

    const sentCount = results.filter((result) => result.status === 'fulfilled').length;
    return { success: sentCount > 0, sentCount, totalSubs: subscriptions.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`broadcastWebPushNotification failed: ${message}`);
    return { success: false, error: message };
  }
}
