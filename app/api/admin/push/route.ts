import { NextResponse } from 'next/server';
import { getCurrentUser, getIsAdmin } from '@/lib/auth-helpers';
import { broadcastWebPushNotification } from '@/lib/web-push';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        const isAdmin = await getIsAdmin();

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, body, url, icon } = await req.json();

        if (!title || !body) {
            return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
        }

        const result = await broadcastWebPushNotification({
            title,
            body,
            url: url || '/dashboard',
            icon: icon || '/icon.webp'
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('[ADMIN_PUSH]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
