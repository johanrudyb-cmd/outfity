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

      // ──────────────────────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // === LOGS DÉTAILLÉS POUR DEBUG ===
        console.log('[Stripe Webhook] ===== checkout.session.completed =====');
        console.log('[Stripe Webhook] Session ID:', session.id);
        console.log('[Stripe Webhook] Mode:', session.mode);
        console.log('[Stripe Webhook] Status:', session.status);
        console.log('[Stripe Webhook] client_reference_id:', session.client_reference_id);
        console.log('[Stripe Webhook] customer:', session.customer);
        console.log('[Stripe Webhook] customer_email:', session.customer_email);
        console.log('[Stripe Webhook] metadata:', JSON.stringify(session.metadata));

        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId || SUBSCRIPTION_PLAN_ID;
        const customerId = session.customer as string;
        const customerEmail = session.customer_email || (session.customer_details as any)?.email;

        console.log('[Stripe Webhook] Resolved userId:', userId);
        console.log('[Stripe Webhook] Resolved planId:', planId);
        console.log('[Stripe Webhook] Resolved customerEmail:', customerEmail);

        // Fonction helper pour mettre à jour le plan
        const activateUser = async (uid: string) => {
          const now = new Date();
          try {
            const updatedUser = await prisma.user.update({
              where: { id: uid },
              data: { plan: planId, subscribedAt: now, stripeCustomerId: customerId },
            });
            console.log('[Stripe Webhook] ✅ DB Update SUCCESS. userId:', uid, '| New plan:', updatedUser.plan);

            // Reset quotas (non bloquant)
            const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            await prisma.aIUsage.deleteMany({
              where: { userId: uid, createdAt: { gte: periodStart } },
            }).catch(e => console.error('[Stripe Webhook] Usage reset error:', e));

            // Notification push (non bloquante)
            sendWebPushNotification(uid, {
              title: '🚀 Plan Créateur Activé',
              body: 'Félicitations ! Tes quotas et outils pros sont débloqués.',
              url: '/dashboard',
            }).catch(() => { });

            return true;
          } catch (dbErr: any) {
            console.error('[Stripe Webhook] ❌ DB Update FAILED. uid:', uid, '| Code:', dbErr.code, '| Msg:', dbErr.message);
            return false;
          }
        };

        if (session.mode === 'subscription') {
          let activated = false;

          // Tentative 1 : par userId
          if (userId) {
            activated = await activateUser(userId);
          } else {
            console.error('[Stripe Webhook] ❌ CRITICAL: No userId in session metadata or client_reference_id!');
          }

          // Tentative 2 : fallback par email si le userId a échoué ou manque
          if (!activated && customerEmail) {
            console.log('[Stripe Webhook] Trying fallback by email:', customerEmail);
            try {
              const userByEmail = await prisma.user.findUnique({ where: { email: customerEmail } });
              if (userByEmail) {
                console.log('[Stripe Webhook] Found user by email:', userByEmail.id);
                activated = await activateUser(userByEmail.id);
              } else {
                console.error('[Stripe Webhook] ❌ No user found by email:', customerEmail);
              }
            } catch (e: any) {
              console.error('[Stripe Webhook] ❌ Email lookup failed:', e.message);
            }
          }

          if (!activated) {
            console.error('[Stripe Webhook] ❌ FAILED to activate user after all attempts. userId:', userId, '| email:', customerEmail);
          }
        }

        // Gestion des packs de crédits surplus
        const packId = session.metadata?.packId;
        if (packId && PACK_TO_FEATURES[packId] && userId) {
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

      // ──────────────────────────────────────────────────────────────────
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const planId = subscription.metadata?.planId || SUBSCRIPTION_PLAN_ID;
        const userId = subscription.metadata?.userId;

        console.log('[Stripe Webhook] Subscription Created:', { customerId, status: subscription.status, userId });

        // Si en trial ou actif → s'assurer que le plan est bien à jour
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          // Chercher par stripeCustomerId d'abord
          const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
          const targetId = user?.id || userId;

          if (targetId) {
            await prisma.user.update({
              where: { id: targetId },
              data: { plan: planId, stripeCustomerId: customerId },
            });
            console.log('[Stripe Webhook] ✅ Plan verified via subscription.created for:', targetId);
          } else {
            console.warn('[Stripe Webhook] ⚠️ subscription.created: No user found for customerId:', customerId);
          }
        }
        break;
      }

      // ──────────────────────────────────────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer as string;

        console.log('[Stripe Webhook] Invoice Paid:', invoice.id, '| amount:', invoice.amount_paid);

        // Backup : s'assurer que le plan est activé même si checkout.session.completed a raté
        if (customerId) {
          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { plan: SUBSCRIPTION_PLAN_ID },
          }).catch(e => console.warn('[Stripe Webhook] invoice.paid: No user with customerId:', customerId, e.code));
        }

        if (!subscriptionId) break;

        // Gestion des affiliés
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const affiliateCode = subscription.metadata?.affiliateCode;

        if (affiliateCode) {
          const affiliate = await prisma.affiliate.findUnique({ where: { referralCode: affiliateCode } });
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
                  status: 'PAID',
                },
              }).catch(e => console.warn('[Stripe Webhook] Commission duplicate skip:', e.message));
              await prisma.affiliate.update({
                where: { id: affiliate.id },
                data: { earningsTotal: { increment: commissionAmount } },
              });
            }
          }
        }
        break;
      }

      // ──────────────────────────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        console.log('[Stripe Webhook] Subscription Updated:', { customerId, status });

        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });

        if (user) {
          if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
            await prisma.user.update({ where: { id: user.id }, data: { plan: 'starter' } });
            console.log('[Stripe Webhook] User downgraded:', user.id);
          } else if (status === 'active' || status === 'trialing') {
            await prisma.user.update({ where: { id: user.id }, data: { plan: SUBSCRIPTION_PLAN_ID } });
            console.log('[Stripe Webhook] User confirmed active/trialing:', user.id);
          }
        }
        break;
      }

      // ──────────────────────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
        if (user) {
          await prisma.user.update({ where: { id: user.id }, data: { plan: 'starter' } });
          console.log('[Stripe Webhook] Subscription deleted, user downgraded:', user.id);
        }
        break;
      }

      // ──────────────────────────────────────────────────────────────────
      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error('[Stripe Webhook] Internal Error:', err);
    return NextResponse.json({ error: 'Internal handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
