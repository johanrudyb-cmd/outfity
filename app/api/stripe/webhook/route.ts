import { NextResponse } from 'next/server';
import { stripe, SUBSCRIPTION_PLAN_ID } from '@/lib/stripe';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { PACK_TO_FEATURES } from '@/lib/surplus-credits';
import { sendWebPushNotification } from '@/lib/web-push';

// Désactiver le body parsing pour recevoir le raw body (requis par Stripe)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('[Stripe Webhook] Request received');
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || !stripe) {
    console.error('[Stripe Webhook] Missing signature, secret or stripe config');
    return NextResponse.json({ error: 'Configuration error' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('[Stripe Webhook] Event verified:', event.type);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Stripe Webhook] Checkout Session Completed:', session.id);

        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId || SUBSCRIPTION_PLAN_ID;
        const customerId = session.customer as string;

        if (!userId) {
          console.error('[Stripe Webhook] No userId found in session');
          break;
        }

        // Activation immédiate pour les subscriptions (même avec trial)
        if (session.mode === 'subscription') {
          console.log('[Stripe Webhook] Activating subscription for user:', userId);
          const now = new Date();

          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planId, // Utiliser le planId de la métadata
              subscribedAt: now,
              stripeCustomerId: customerId
            },
          });

          console.log('[Stripe Webhook] DB Update (Session) - SUCCESS. New plan:', updatedUser.plan);

          // Reset des quotas
          const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          await prisma.aIUsage.deleteMany({
            where: { userId, createdAt: { gte: periodStart } },
          }).catch(e => console.error('[Stripe Webhook] Usage reset error:', e));

          // Notifier l'utilisateur
          try {
            await sendWebPushNotification(userId, {
              title: "🚀 Plan Créateur Activé",
              body: "Félicitations ! Tes quotas et outils pros sont débloqués.",
              url: "/dashboard"
            });
          } catch (e) { }
        }

        // Gestion des packs de crédits surplus
        const packId = session.metadata?.packId;
        if (packId && PACK_TO_FEATURES[packId]) {
          console.log('[Stripe Webhook] Processing pack credits:', packId);
          const features = PACK_TO_FEATURES[packId];
          for (const { feature, amount } of features) {
            await prisma.surplusCredits.create({
              data: {
                userId,
                feature,
                amount,
                consumed: 0,
                stripeSessionId: `${session.id}-${feature}`,
                packId,
              },
            }).catch(e => console.warn('[Stripe Webhook] Credit skip (duplicate):', e.message));
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const planId = subscription.metadata?.planId || SUBSCRIPTION_PLAN_ID;

        console.log('[Stripe Webhook] Subscription Created:', { customerId, status: subscription.status });

        // Si la souscription est active ou en trial, on s'assure que l'utilisateur a le bon plan
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          const user = await prisma.user.findUnique({
            where: { stripeCustomerId: customerId },
          });

          // Si on trouve pas par customerId, on cherche par userId dans la métadata (cas rare)
          const userId = subscription.metadata?.userId;
          const targetUserId = user?.id || userId;

          if (targetUserId) {
            await prisma.user.update({
              where: { id: targetUserId },
              data: {
                plan: planId,
                stripeCustomerId: customerId // Au cas où ce n'était pas encore lié
              }
            });
            console.log('[Stripe Webhook] User plan verified/activated via subscription.created:', targetUserId);
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer as string;

        console.log('[Stripe Webhook] Invoice Paid:', invoice.id);

        // Backup activation : Si l'invoice est payée (même à 0€ en trial), on valide le plan
        if (customerId) {
          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { plan: SUBSCRIPTION_PLAN_ID } // On assume 'creator' pour les payants
          }).catch(() => { /* User might not be linked yet, handled by session.completed */ });
        }

        if (!subscriptionId) break;

        // Récupérer la souscription pour voir s'il y a un code affilié
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const affiliateCode = subscription.metadata?.affiliateCode;

        if (affiliateCode) {
          const affiliate = await prisma.affiliate.findUnique({
            where: { referralCode: affiliateCode }
          });

          if (affiliate) {
            const amountPaid = invoice.amount_paid / 100;
            const commissionAmount = amountPaid * affiliate.commissionRate;
            if (commissionAmount > 0) {
              await prisma.affiliateCommission.create({
                data: {
                  affiliateId: affiliate.id,
                  orderId: invoice.id,
                  amount: commissionAmount,
                  currency: invoice.currency.toUpperCase(),
                  status: 'PAID'
                }
              });
              await prisma.affiliate.update({
                where: { id: affiliate.id },
                data: { earningsTotal: { increment: commissionAmount } }
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'starter' } // Revenir au plan Starter/Free
          });
          console.log('[Stripe Webhook] Subscription deleted, user downgraded:', user.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        console.log('[Stripe Webhook] Subscription Updated:', { customerId, status });

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
            await prisma.user.update({
              where: { id: user.id },
              data: { plan: 'starter' }
            });
            console.log('[Stripe Webhook] User downgraded:', user.id);
          } else if (status === 'active' || status === 'trialing') {
            // S'assurer qu'il est bien 'creator' s'il redevient actif
            await prisma.user.update({
              where: { id: user.id },
              data: { plan: SUBSCRIPTION_PLAN_ID }
            });
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error('[Stripe Webhook] Internal Error:', err);
    return NextResponse.json({ error: 'Internal handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
