import { NextResponse } from 'next/server';
import { stripe, SUBSCRIPTION_PLAN_ID, SUBSCRIPTION_PRICE_EUR } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth-helpers';

export const runtime = 'nodejs';

export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans .env.' },
        { status: 503 }
      );
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const origin = baseUrl.replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Plan Créateur - Offre Spéciale',
              description: 'Accès 29€/mois à vie (au lieu de 39€) + 3 jours d\'essai gratuit. Inclus : Virgil, Pharrell, Ada, Johan.',
              images: [],
            },
            unit_amount: SUBSCRIPTION_PRICE_EUR * 100, // centimes
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          userId: user.id,
          planId: SUBSCRIPTION_PLAN_ID,
        },
      },
      success_url: `${origin}/onboarding?subscribed=true`,
      cancel_url: `${origin}/auth/choose-plan?canceled=true`,
      metadata: {
        userId: user.id,
        planId: SUBSCRIPTION_PLAN_ID,
      },
      customer_email: user.email ?? undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('[Stripe subscription]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'abonnement' },
      { status: 500 }
    );
  }
}
