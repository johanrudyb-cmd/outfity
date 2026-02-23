import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - Récupérer toutes les collections d'une marque
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId est requis' },
        { status: 400 }
      );
    }

    // Vérification brand + collections en parallèle
    const [brand, collections] = await Promise.all([
      prisma.brand.findFirst({ where: { id: brandId, userId: user.id }, select: { id: true } }),
      prisma.collection.findMany({
        where: { brandId },
        include: { _count: { select: { designs: true } } },
        orderBy: { name: 'asc' },
      }),
    ]);

    if (!brand) return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });

    return NextResponse.json({ collections });
  } catch (error: any) {
    console.error('Erreur dans /api/collections GET:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle collection
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, name, description, coverImage } = body;

    if (!brandId || !name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'brandId et name sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que la marque appartient à l'utilisateur
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Marque non trouvée' },
        { status: 404 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        brandId,
        name: name.trim(),
        description: description?.trim() || null,
        coverImage: coverImage || null,
      },
      include: {
        _count: {
          select: { designs: true },
        },
      },
    });

    return NextResponse.json({ success: true, collection }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur dans /api/collections POST:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
