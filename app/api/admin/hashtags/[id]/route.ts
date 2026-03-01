import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIsAdmin } from '@/lib/auth-helpers';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await getIsAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await (prisma as any).trackedHashtag.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete hashtag', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await getIsAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { isActive } = await req.json();

        const updated = await (prisma as any).trackedHashtag.update({
            where: { id },
            data: { isActive }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to update hashtag', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
