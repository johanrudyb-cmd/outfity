import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const authUser = await getCurrentUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: {
        universe?: string;
        universeId?: string;
        productType?: string;
        brandName?: string;
        pitch?: string;
        logoUrl?: string;
        instagram?: string;
        plan?: string;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { universe, universeId, productType, brandName, pitch, logoUrl, instagram, plan } = body;

    if (!brandName || brandName.trim().length < 2) {
        return NextResponse.json({ error: 'Le nom de la marque est requis.' }, { status: 400 });
    }

    try {
        // 1. Créer ou mettre à jour la marque principale
        const existingBrand = await prisma.brand.findFirst({
            where: { userId: authUser.id },
            orderBy: { createdAt: 'asc' },
        });

        const socialHandles: Record<string, string> = {};
        if (instagram?.trim()) socialHandles.instagram = instagram.trim();

        const styleGuide = {
            preferredStyle: universe,
            universeId,
            mainProduct: productType,
            story: pitch,
        };

        if (existingBrand) {
            await prisma.brand.update({
                where: { id: existingBrand.id },
                data: {
                    name: brandName.trim(),
                    logo: logoUrl?.trim() || existingBrand.logo,
                    socialHandles: (Object.keys(socialHandles).length ? socialHandles : existingBrand.socialHandles) as any,
                    styleGuide: styleGuide as any,
                    status: 'active',
                },
            });
        } else {
            await prisma.brand.create({
                data: {
                    userId: authUser.id,
                    name: brandName.trim(),
                    logo: logoUrl?.trim() || null,
                    socialHandles: (Object.keys(socialHandles).length ? socialHandles : null) as any,
                    styleGuide: styleGuide as any,
                    status: 'active',
                    creationMode: 'onboarding',
                },
            });
        }

        // 2. Marquer l'onboarding comme complété
        const dbUser = await prisma.user.findUnique({ where: { id: authUser.id }, select: { plan: true } });
        const currentPlan = dbUser?.plan || authUser.plan;

        // Seule l'évolution vers 'starter' est autorisée par cette route (onboarding). 
        // Le passage à 'creator' se fait exclusivement via les webhooks Stripe.
        let targetPlan = currentPlan;
        if (currentPlan === 'free') {
            targetPlan = 'starter';
        }

        await prisma.user.update({
            where: { id: authUser.id },
            data: {
                onboardingCompleted: true,
                plan: targetPlan,
                onboardingData: {
                    universe,
                    universeId,
                    productType,
                    brandName: brandName.trim(),
                    pitch,
                    completedAt: new Date().toISOString(),
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[complete-onboarding]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
