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

        console.log('[Stripe Webhook] DEBUG - Session Object:', JSON.stringify(session, null, 2));
        console.log('[Stripe Webhook] DEBUG - userId found:', userId);
        console.log('[Stripe Webhook] DEBUG - metadata:', session.metadata);

        if (!userId) {
          console.error('[Stripe Webhook] No userId found in session');
          break;
        }

        const customerId = session.customer as string;

        // Activation de l'abonnement
        if (session.mode === 'subscription') {
          console.log('[Stripe Webhook] Activating subscription for user:', userId);
          const now = new Date();

          console.log('[Stripe Webhook] DB Update - Attempting update for userId:', userId);
          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              plan: SUBSCRIPTION_PLAN_ID,
              subscribedAt: now,
              stripeCustomerId: customerId
            },
          });

          console.log('[Stripe Webhook] DB Update - SUCCESS. New plan:', updatedUser.plan);

          // Reset des quotas
          const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          await prisma.aIUsage.deleteMany({
            where: {
              userId,
              createdAt: { gte: periodStart },
            },
          });

          // Notifier l'utilisateur
          try {
            await sendWebPushNotification(userId, {
              title: "🚀 Plan Créateur Activé",
              body: "Félicitations ! Tes quotas et outils pros sont débloqués.",
              url: "/dashboard"
            });
          } catch (e) { console.error(e); }

          // Webhook n8n (optionnel, on log l'erreur mais on ne bloque pas)
          try {
            const N8N_WEBHOOK_SUBSCRIPTION_URL = process.env.N8N_WEBHOOK_SUBSCRIPTION_URL || 'http://localhost:5678/webhook/outfity-subscription';
            fetch(N8N_WEBHOOK_SUBSCRIPTION_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'subscription_created',
                userId,
                email: updatedUser.email,
                planId,
                timestamp: now.toISOString()
              }),
            }).catch(e => console.error('[Stripe Webhook] n8n fetch error:', e));
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
            }).catch(e => console.warn('[Stripe Webhook] Credit skip (likely duplicate):', e.message));
          }

          // Notifier de l'ajout
          try {
            await sendWebPushNotification(userId, {
              title: "🔋 Quotas rechargés !",
              body: `Ton pack ${packId} a été ajouté avec succès à ton total.`,
              url: "/usage"
            });
          } catch (e) { console.error(e); }
        }

        // Gestion des packs de crédits surplus... (keep existing logic)
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Récupérer la souscription pour voir s'il y a un code affilié
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const affiliateCode = subscription.metadata?.affiliateCode;

        if (affiliateCode) {
          console.log('[Stripe Webhook] Affiliate code found in subscription:', affiliateCode);
          const affiliate = await prisma.affiliate.findUnique({
            where: { referralCode: affiliateCode }
          });

          if (affiliate) {
            const amountPaid = invoice.amount_paid / 100;
            const commissionAmount = amountPaid * affiliate.commissionRate;

            console.log(`[Stripe Webhook] Crediting ${commissionAmount}€ to affiliate ${affiliate.name} for paid invoice`);

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
              data: {
                earningsTotal: { increment: commissionAmount }
              }
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        console.log('[Stripe Webhook] Subscription update/delete:', { customerId, status });

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (user && (status === 'canceled' || status === 'unpaid')) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'free' }
          });
          console.log('[Stripe Webhook] User downgraded to free:', user.id);
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
