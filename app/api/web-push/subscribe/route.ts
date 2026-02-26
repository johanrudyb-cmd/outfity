import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const subscription = await req.json();

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
        }

        // Upsert subscription based on endpoint to avoid duplicates
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            create: {
                userId: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
            update: {
                userId: user.id,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[WebPush Subscribe Error]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
