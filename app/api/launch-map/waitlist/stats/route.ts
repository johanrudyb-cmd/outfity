import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');

        if (!brandId) {
            return NextResponse.json({ error: 'brandId manquant' }, { status: 400 });
        }

        // Vérifier que la marque appartient à l'utilisateur
        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: currentUser.id }
        });

        if (!brand) return NextResponse.json({ error: 'Marque introuvable' }, { status: 404 });

        const count = await prisma.waitlistLead.count({
            where: { brandId }
        });

        // Tu peux ajouter d'autres stats ici plus tard (conversion, sources...)
        return NextResponse.json({ count });

    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
