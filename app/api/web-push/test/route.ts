import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { sendWebPushNotification } from '@/lib/web-push';

export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const result = await sendWebPushNotification(user.id, {
            title: body.title || 'Notification Test OUTFITY',
            body: body.message || 'Ceci est un test configuré avec succès !',
            url: '/dashboard'
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('[WebPush Test Error]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
