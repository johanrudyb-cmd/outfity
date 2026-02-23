import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const templatesOnly = searchParams.get('templates') === 'true';

    if (!brandId) {
      return NextResponse.json({ error: 'brandId requis' }, { status: 400 });
    }

    // Vérification brand + fetch designs en parallèle
    const [brand, designs] = await Promise.all([
      prisma.brand.findFirst({ where: { id: brandId, userId: user.id }, select: { id: true } }),
      prisma.design.findMany({
        where: templatesOnly ? { brandId, isTemplate: true } : { brandId },
        orderBy: templatesOnly ? { templateName: 'asc' } : { createdAt: 'desc' },
        select: {
          id: true, brandId: true, collectionId: true, isTemplate: true, templateName: true,
          type: true, cut: true, material: true, flatSketchUrl: true, productImageUrl: true,
          status: true, createdAt: true, updatedAt: true,
        },
      }),
    ]);

    if (!brand) return NextResponse.json({ error: 'Marque non trouvée' }, { status: 404 });

    return NextResponse.json({ designs });
  } catch (error: any) {
    console.error('Erreur dans /api/designs:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
