import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/** GET : retourne le contexte stratégie pour pré-remplir / verrouiller les champs mannequin (cible, positionnement) */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId')?.trim();
    if (!brandId) return NextResponse.json({ error: 'brandId requis' }, { status: 400 });

    // Parallèle : vérif brand + dernière stratégie
    const [brand, latest] = await Promise.all([
      prisma.brand.findFirst({ where: { id: brandId, userId: user.id }, select: { id: true } }),
      prisma.strategyGeneration.findFirst({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
        select: { targetAudience: true, positioning: true },
      }),
    ]);
    if (!brand) return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });

    return NextResponse.json({
      targetAudience: latest?.targetAudience ?? null,
      positioning: latest?.positioning ?? null,
    });
  } catch (e) {
    console.error('GET /api/ugc/mannequin-strategy-context', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
