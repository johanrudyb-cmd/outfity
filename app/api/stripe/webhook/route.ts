import { NextResponse } from 'next/server';
import { stripe, SUBSCRIPTION_PLAN_ID } from '@/lib/stripe';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { PACK_TO_FEATURES } from '@/lib/surplus-credits';

// Désactiver le body parsing pour recevoir le raw body (requis par Stripe)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || !stripe) {
    console.error('[Stripe webhook] Missing signature, STRIPE_WEBHOOK_SECRET or Stripe not configured');
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe!.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const packId = session.metadata?.packId;
        const planId = session.metadata?.planId || SUBSCRIPTION_PLAN_ID;
        const sessionId = session.id;

        if (!userId) {
          console.warn('[Stripe webhook] Missing userId in client_reference_id and metadata');
          break;
        }

        const customerId = session.customer as string;

        // Abonnement plan Créateur (34€/mois)
        if (session.mode === 'subscription' && planId === SUBSCRIPTION_PLAN_ID) {
          const now = new Date();
          // Mettre à jour le plan et la date d'abonnement (reset des quotas mensuels)
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: SUBSCRIPTION_PLAN_ID,
              subscribedAt: now,
              stripeCustomerId: customerId // Sauvegarder l'ID client
            },
          });
          // Supprimer les consommations IA de ce mois pour reset immédiat des quotas
          const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          await prisma.aIUsage.deleteMany({
            where: {
              userId,
              createdAt: { gte: periodStart },
            },
          });
          console.log('[Stripe webhook] Subscription activated + quotas reset:', { userId, planId, customerId });

          // Récupérer les infos utilisateur pour faciliter l'envoi d'email via n8n
          const userObj = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });

          // Déclencher le webhook n8n pour la séquence email "Créateur"
          try {
            const N8N_WEBHOOK_SUBSCRIPTION_URL = process.env.N8N_WEBHOOK_SUBSCRIPTION_URL || 'http://localhost:5678/webhook/outfity-subscription';
            fetch(N8N_WEBHOOK_SUBSCRIPTION_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'subscription_created',
                userId,
                email: userObj?.email || '',
                name: userObj?.name || 'Créateur',
                planId,
                customerId,
                timestamp: new Date().toISOString()
              }),
            }).catch(e => console.error('[Stripe webhook] Erreur fetch webhook n8n subscription:', e));
          } catch (e) {
            console.error('[Stripe webhook] Erreur préparation webhook n8n:', e);
          }

          break;
        }

        // Cas général : mettre à jour le stripeCustomerId s'il n'existe pas
        if (customerId) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId }
          }).catch(() => { }); // Ignorer si erreur (déjà fait ou concurrent)
        }

        if (!packId) {
          console.warn('[Stripe webhook] Missing packId in metadata');
          break;
        }

        const features = PACK_TO_FEATURES[packId];
        if (!features?.length) {
          console.warn('[Stripe webhook] Unknown packId:', packId);
          break;
        }

        for (const { feature, amount } of features) {
          const existing = await prisma.surplusCredits.findUnique({
            where: { stripeSessionId: `${sessionId}-${feature}` },
          });
          if (existing) {
            console.log('[Stripe webhook] Already credited (idempotent):', sessionId, feature);
            continue;
          }
          await prisma.surplusCredits.create({
            data: {
              userId,
              feature,
              amount,
              consumed: 0,
              stripeSessionId: `${sessionId}-${feature}`,
              packId,
            },
          });
          console.log('[Stripe webhook] Credited:', { userId, packId, feature, amount });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription> | undefined;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;

        const isCanceled = status === 'canceled' || status === 'unpaid' || cancelAtPeriodEnd;
        const isTrialConverted = previousAttributes?.status === 'trialing' && status === 'active';

        // Trouver l'utilisateur lié à ce client Stripe
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          if (isTrialConverted) {
            console.log('[Stripe webhook] Trial converted to active for user:', user.id);
            // Webhook n8n pour la conversion de l'essai
            try {
              const N8N_WEBHOOK_SUBSCRIPTION_URL = process.env.N8N_WEBHOOK_SUBSCRIPTION_URL || 'http://localhost:5678/webhook/outfity-subscription';
              fetch(N8N_WEBHOOK_SUBSCRIPTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'trial_converted',
                  userId: user.id,
                  email: user.email,
                  name: user.name || 'Créateur',
                  status: status,
                  timestamp: new Date().toISOString()
                }),
              }).catch(e => console.error('[Stripe webhook] Erreur fetch webhook n8n trial converted:', e));
            } catch (e) {
              console.error('[Stripe webhook] Erreur préparation webhook n8n:', e);
            }
          }

          if (isCanceled) {
            // Si c'est complètement supprimé (deleted), on remet en free direct
            if (event.type === 'customer.subscription.deleted' || status === 'canceled' || status === 'unpaid') {
              await prisma.user.update({
                where: { id: user.id },
                data: { plan: 'free' }
              });
              console.log('[Stripe webhook] Subscription canceled/deleted, user downgraded to free:', user.id);
            } else {
              if (previousAttributes && previousAttributes.cancel_at_period_end === false && cancelAtPeriodEnd === true) {
                console.log('[Stripe webhook] Subscription set to cancel at period end for user:', user.id);
              }
            }

            // Webhook n8n pour la résiliation (on envoie si ça vient d'être annulé)
            // On vérifie que cancel_at_period_end vient juste de passer à true, ou que c'est un delete
            const justCanceled = (previousAttributes?.cancel_at_period_end === false && cancelAtPeriodEnd === true) || event.type === 'customer.subscription.deleted';

            if (justCanceled) {
              try {
                const N8N_WEBHOOK_SUBSCRIPTION_URL = process.env.N8N_WEBHOOK_SUBSCRIPTION_URL || 'http://localhost:5678/webhook/outfity-subscription';
                fetch(N8N_WEBHOOK_SUBSCRIPTION_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    event: 'subscription_canceled',
                    userId: user.id,
                    email: user.email,
                    name: user.name || 'Créateur',
                    status: status,
                    cancelAtPeriodEnd: cancelAtPeriodEnd,
                    timestamp: new Date().toISOString()
                  }),
                }).catch(e => console.error('[Stripe webhook] Erreur fetch webhook n8n cancellation:', e));
              } catch (e) {
                console.error('[Stripe webhook] Erreur préparation webhook n8n:', e);
              }
            }
          }
        } else {
          console.warn('[Stripe webhook] Webhook update/delete: No user found for stripe customer:', customerId);
        }
        break;
      }

      default:
        console.log(`[Stripe webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error('[Stripe webhook] Handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
