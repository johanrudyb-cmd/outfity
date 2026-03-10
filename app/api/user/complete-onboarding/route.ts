import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { isPaidPlan } from '@/lib/plan-utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const authUser = await getCurrentUser();
    if (!authUser || (authUser as any).isGhost || !authUser.id) {
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
        const currentDbPlan = dbUser?.plan;

        console.log('[Onboarding] Plan check - Request body plan:', plan, ' | DB current plan:', currentDbPlan);

        // Déterminer le plan final : S'ils sont DEJA payants en base de données -> Créateur
        // On n'écoute plus le `plan` venant du body du front pour éviter de donner un plan gratuit sans paiement Stripe.
        let targetPlan: string;
        if (isPaidPlan(currentDbPlan)) {
            targetPlan = 'creator'; // Unification vers 'creator' pour tous les accès payants
        } else {
            targetPlan = 'starter';
        }

        console.log('[Onboarding] Setting target plan:', targetPlan);

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

        // 3. Notifier n8n/webhook (Optionnel)
        if (process.env.ONBOARDING_WEBHOOK_URL) {
            fetch(process.env.ONBOARDING_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'onboarding.completed',
                    user: {
                        id: authUser.id,
                        email: authUser.email,
                        name: authUser.name,
                        plan: targetPlan
                    },
                    brand: {
                        name: brandName.trim(),
                        universe,
                        productType,
                        pitch
                    }
                })
            }).catch(e => console.error('[Webhook] Failed:', e));
        }

        return NextResponse.json({ success: true, plan: targetPlan });
    } catch (err) {
        console.error('[complete-onboarding]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
