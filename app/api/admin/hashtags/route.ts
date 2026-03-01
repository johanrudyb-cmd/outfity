import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.email !== 'joada22@icloud.com') { // Basic admin check or from env
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hashtags = await (prisma as any).trackedHashtag.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(hashtags);
    } catch (error) {
        console.error('Failed to fetch hashtags', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.email !== 'joada22@icloud.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let { hashtag, category } = await req.json();

        // Clean hashtag
        hashtag = hashtag.replace(/^#/, '').trim().toLowerCase();

        if (!hashtag) {
            return NextResponse.json({ error: 'Hashtag required' }, { status: 400 });
        }

        const newHashtag = await (prisma as any).trackedHashtag.create({
            data: {
                hashtag,
                category: category || null
            }
        });

        return NextResponse.json(newHashtag);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Hashtag already tracked' }, { status: 400 });
        }
        console.error('Failed to add hashtag', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
