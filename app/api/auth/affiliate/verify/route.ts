import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    try {
        const affiliate = await prisma.affiliate.findUnique({
            where: { invitationToken: token },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
            }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Invitation invalide ou expirée' }, { status: 404 });
        }

        if (affiliate.status === 'ACTIVE') {
            return NextResponse.json({ error: 'Compte déjà activé' }, { status: 400 });
        }

        return NextResponse.json(affiliate);
    } catch (error) {
        console.error('[Verify API] Erreur:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
