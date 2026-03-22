import { NextResponse } from 'next/server';
import { stripe, SURPLUS_PACKS_STRIPE } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans .env (sk_test_... pour le mode démo).' },
        { status: 503 }
      );
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { packId } = await request.json();
    if (!packId || typeof packId !== 'string') {
      return NextResponse.json({ error: 'packId requis' }, { status: 400 });
    }

    const pack = SURPLUS_PACKS_STRIPE[packId];
    if (!pack) {
      return NextResponse.json({ error: 'Pack invalide' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe!.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: pack.currency,
            product_data: {
              name: pack.name,
              description: pack.description,
            },
            unit_amount: pack.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/usage?success=true`,
      cancel_url: `${baseUrl}/usage?canceled=true`,
      metadata: {
        userId: user.id,
        packId,
      },
      ...(user.email ? { customer_email: user.email } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('[Stripe checkout]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création de la session' },
      { status: 500 }
    );
  }
}
