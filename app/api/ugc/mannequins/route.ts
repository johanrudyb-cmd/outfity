import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/** GET : liste des mannequins de la marque */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    if (!brandId) return NextResponse.json({ error: 'brandId requis' }, { status: 400 });

    // Vérification brand + mannequins en parallèle
    const [brand, mannequins] = await Promise.all([
      prisma.brand.findFirst({ where: { id: brandId, userId: user.id }, select: { id: true } }),
      prisma.mannequin.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, brandId: true, name: true, imageUrl: true, source: true, createdAt: true },
      }),
    ]);
    if (!brand) return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });
    return NextResponse.json(mannequins);
  } catch (e) {
    console.error('GET /api/ugc/mannequins', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** POST : créer un mannequin (image de référence + nom, source virtual_tryon ou upload) */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const brandId = typeof body.brandId === 'string' ? body.brandId : null;
    const name = typeof body.name === 'string' ? body.name.trim() : null;
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : null;
    const source = body.source === 'upload' ? 'upload' : 'virtual_tryon';

    if (!brandId || !name || !imageUrl) {
      return NextResponse.json(
        { error: 'brandId, name et imageUrl requis' },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });
    if (!brand) return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });

    const mannequin = await prisma.mannequin.create({
      data: { brandId, name, imageUrl, source },
    });
    return NextResponse.json(mannequin);
  } catch (e) {
    console.error('POST /api/ugc/mannequins', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
