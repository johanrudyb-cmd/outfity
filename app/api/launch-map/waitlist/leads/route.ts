import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');
        const designId = searchParams.get('designId');

        if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 });

        const leads = await prisma.waitlistLead.findMany({
            where: {
                brandId,
                ...(designId ? { designId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ leads });
    } catch (err) {
        console.error('Fetch leads error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
