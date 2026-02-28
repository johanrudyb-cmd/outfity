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
                name: true,
                email: true,
                status: true
            }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Invitation invalide' }, { status: 404 });
        }

        if (affiliate.status === 'ACTIVE') {
            return NextResponse.json({ error: 'Ce compte est déjà activé. Veuillez vous connecter.' }, { status: 400 });
        }

        return NextResponse.json({
            name: affiliate.name,
            email: affiliate.email
        });
    } catch (error) {
        console.error('[Partner Verify API] Erreur:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
