import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');
        const agentKey = searchParams.get('agentKey');

        if (!brandId || !agentKey) {
            return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
        }

        const messages = await prisma.agentMessage.findMany({
            where: {
                brandId,
                agentKey,
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: 100,
        });

        return NextResponse.json({
            messages: messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.createdAt,
            }))
        });
    } catch (error) {
        console.error('[chat-history] GET error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');
        const agentKey = searchParams.get('agentKey');

        if (!brandId || !agentKey) {
            return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
        }

        await prisma.agentMessage.deleteMany({
            where: {
                brandId,
                agentKey,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[chat-history] DELETE error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
