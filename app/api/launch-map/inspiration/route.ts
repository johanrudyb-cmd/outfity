import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * POST /api/launch-map/inspiration
 * Sauvegarde le positionnement + marque d'inspiration choisie par l'utilisateur (plan gratuit ou créateur).
 * Pas d'appel IA — juste stockage en DB.
 * Inclut la limite de 3 changements de marque par mois.
 */
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { brandId, templateBrandSlug, positioning, targetAudience } = await req.json();

    if (!brandId || !templateBrandSlug) {
        return NextResponse.json({ error: 'brandId et templateBrandSlug requis' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
        where: { id: brandId, userId: user.id },
        select: {
            id: true,
            templateBrandSlug: true,
            inspirationChangesCount: true,
            inspirationChangedAt: true,
        },
    });

    if (!brand) return NextResponse.json({ error: 'Marque introuvable' }, { status: 404 });

    // Vérifier la limite de changement (3x par mois)
    const isNewSlug = brand.templateBrandSlug !== templateBrandSlug;
    if (isNewSlug && brand.templateBrandSlug) {
        const now = new Date();
        const lastChange = brand.inspirationChangedAt;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const changesThisMonth = lastChange && lastChange >= startOfMonth
            ? brand.inspirationChangesCount
            : 0;

        if (changesThisMonth >= 3) {
            return NextResponse.json({
                error: 'LIMIT_REACHED',
                message: 'Tu as atteint la limite de 3 changements de marque d\'inspiration par mois.',
                remaining: 0,
            }, { status: 429 });
        }
    }

    // Calculer le compteur mis à jour
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastChange = brand.inspirationChangedAt;
    const changesThisMonth = lastChange && lastChange >= startOfMonth
        ? brand.inspirationChangesCount
        : 0;

    const newCount = isNewSlug && brand.templateBrandSlug
        ? changesThisMonth + 1
        : changesThisMonth;

    // Sauvegarder les choix en DB
    const updatedBrand = await prisma.brand.update({
        where: { id: brandId },
        data: {
            templateBrandSlug,
            styleGuide: {
                ...(brand as any).styleGuide,
                preferredStyle: positioning || undefined,
                targetAudience: targetAudience || undefined,
            },
            inspirationChangesCount: newCount,
            ...(isNewSlug && brand.templateBrandSlug ? { inspirationChangedAt: now } : {}),
        },
        select: {
            id: true,
            templateBrandSlug: true,
            inspirationChangesCount: true,
            inspirationChangedAt: true,
        },
    });

    const startOfMonthNew = new Date(now.getFullYear(), now.getMonth(), 1);
    const changesNow = updatedBrand.inspirationChangedAt && updatedBrand.inspirationChangedAt >= startOfMonthNew
        ? updatedBrand.inspirationChangesCount
        : 0;

    return NextResponse.json({
        success: true,
        remaining: Math.max(0, 3 - changesNow),
        changesThisMonth: changesNow,
    });
}

/**
 * GET /api/launch-map/inspiration?brandId=xxx
 * Retourne les infos d'inspiration actuelles + compteur restant.
 */
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const brandId = req.nextUrl.searchParams.get('brandId');
    if (!brandId) return NextResponse.json({ error: 'brandId requis' }, { status: 400 });

    const brand = await prisma.brand.findFirst({
        where: { id: brandId, userId: user.id },
        select: {
            templateBrandSlug: true,
            inspirationChangesCount: true,
            inspirationChangedAt: true,
            styleGuide: true,
        },
    });

    if (!brand) return NextResponse.json({ error: 'Marque introuvable' }, { status: 404 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const changesThisMonth = brand.inspirationChangedAt && brand.inspirationChangedAt >= startOfMonth
        ? brand.inspirationChangesCount
        : 0;

    return NextResponse.json({
        templateBrandSlug: brand.templateBrandSlug,
        styleGuide: brand.styleGuide,
        changesThisMonth,
        remaining: Math.max(0, 3 - changesThisMonth),
    });
}
