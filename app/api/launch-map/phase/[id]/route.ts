import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { isFreePlan } from '@/lib/plan-utils';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const phaseId = parseInt(id, 10);

        if (Number.isNaN(phaseId) || phaseId < 0 || phaseId > 8) {
            return NextResponse.json({ error: 'Invalid phase' }, { status: 404 });
        }

        let brand = await prisma.brand.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: { launchMap: true },
        });

        if (!brand) {
            brand = await prisma.brand.create({
                data: {
                    userId: user.id,
                    name: 'Ma Première Marque',
                    launchMap: {
                        create: {
                            phase1: false,
                            phase2: false,
                            phase3: false,
                            phase4: false,
                            phase5: false,
                            phase6: false,
                        },
                    },
                },
                include: { launchMap: true },
            });
        }

        if (!brand) {
            return NextResponse.json({ error: 'Brand unavailable' }, { status: 500 });
        }

        const hasIdentity = Boolean(brand.name && brand.name.trim().length >= 2);

        const [quotesWithFactory, favoriteFactories] = await Promise.all([
            prisma.quote.findMany({
                where: { brandId: brand.id },
                include: { factory: true },
            }),
            prisma.brandFavoriteFactory.findMany({
                where: { brandId: brand.id },
                include: { factory: true },
            }),
        ]);

        const suppliersMap = new Map<string, { id: string; name: string; country: string; moq?: number; leadTime?: number; quoteCount: number }>();

        for (const q of quotesWithFactory) {
            const f = q.factory;
            const existing = suppliersMap.get(f.id);
            if (existing) {
                existing.quoteCount += 1;
            } else {
                suppliersMap.set(f.id, { id: f.id, name: f.name, country: f.country, moq: f.moq ?? undefined, leadTime: f.leadTime ?? undefined, quoteCount: 1 });
            }
        }

        for (const fav of favoriteFactories) {
            const f = fav.factory;
            if (!suppliersMap.has(f.id)) {
                suppliersMap.set(f.id, { id: f.id, name: f.name, country: f.country, moq: f.moq ?? undefined, leadTime: f.leadTime ?? undefined, quoteCount: 0 });
            }
        }

        const suppliers = Array.from(suppliersMap.values());

        const lm = brand.launchMap;
        const launchMap = lm ? {
            id: lm.id,
            phase1: lm.phase1,
            phase2: lm.phase2,
            phase3: lm.phase3,
            phase4: lm.phase4,
            phase5: lm.phase5,
            phase6: lm.phase6,
            phase7: lm.phase7,
            phase8: lm.phase8,
            shopifyShopDomain: lm.shopifyShopDomain,
            phase1Data: lm.phase1Data,
            baseMockupByProductType: lm.baseMockupByProductType,
            phaseSummaries: lm.phaseSummaries,
            siteCreationTodo: lm.siteCreationTodo,
        } : null;

        const [designCount, quoteCount, ugcCount] = await Promise.all([
            prisma.design.count({ where: { brandId: brand.id, status: 'completed' } }),
            prisma.quote.count({ where: { brandId: brand.id } }),
            prisma.uGCContent.count({ where: { brandId: brand.id } }),
        ]);

        return NextResponse.json({
            brand: { id: brand.id, name: brand.name, logo: brand.logo },
            brandFull: brand,
            launchMap,
            hasIdentity,
            designCount,
            quoteCount,
            ugcCount,
            suppliers,
            userPlan: user.plan,
            isLocked: isFreePlan(user.plan) && ![0, 1, 2, 7].includes(phaseId),
        });
    } catch (error) {
        console.error('Phase API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
