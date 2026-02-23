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

    const brands = await prisma.brand.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        logo: true,
        logoVariations: true,
        colorPalette: true,
        templateBrandSlug: true,
        status: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error('Erreur dans /api/brands GET:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      logo,
      logoVariations,
      colorPalette,
      typography,
      styleGuide,
      domain,
      socialHandles,
      templateBrandSlug,
      creationMode,
      autoApplyIdentity,
      status,
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom de la marque est requis' },
        { status: 400 }
      );
    }

    // Créer la marque avec Launch Map et identité
    const brand = await prisma.brand.create({
      data: {
        userId: user.id,
        name: name.trim(),
        logo: logo || null,
        logoVariations: logoVariations || null,
        colorPalette: colorPalette || null,
        typography: typography || null,
        styleGuide: styleGuide || null,
        domain: domain || null,
        socialHandles: socialHandles || null,
        templateBrandSlug: typeof templateBrandSlug === 'string' ? templateBrandSlug.trim() || null : null,
        creationMode: creationMode || 'quick',
        autoApplyIdentity: autoApplyIdentity !== undefined ? autoApplyIdentity : true,
        status: status || 'draft',
        launchMap: {
          create: {
            phase1: false,
            phase2: false,
            phase3: false,
            phase4: false,
            // phase5: false — défini par @default(false) dans le schéma Prisma
          },
        },
      },
      include: {
        launchMap: true,
      },
    });

    return NextResponse.json({ success: true, brand }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur dans /api/brands POST:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
