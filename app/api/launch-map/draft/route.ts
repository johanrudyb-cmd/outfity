import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    try {
        const { brandId, draft } = await req.json();
        if (!brandId) return NextResponse.json({ error: 'brandId requis' }, { status: 400 });

        // Vérifier que la marque appartient à l'utilisateur
        const brand = await prisma.brand.findFirst({
            where: { id: brandId, userId: session.user.id }
        });
        if (!brand) return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });

        await prisma.launchMap.upsert({
            where: { brandId },
            update: { techPackDraft: draft },
            create: {
                brandId,
                techPackDraft: draft
            }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[API Draft] Error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const brandId = req.nextUrl.searchParams.get('brandId');
    if (!brandId) return NextResponse.json({ error: 'brandId requis' }, { status: 400 });

    try {
        const lm = await prisma.launchMap.findUnique({
            where: { brandId },
            select: { techPackDraft: true }
        });

        return NextResponse.json({ draft: lm?.techPackDraft ?? null });
    } catch (err) {
        console.error('[API Draft] GET Error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
