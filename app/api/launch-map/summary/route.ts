import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getWeekEvents } from '@/lib/calendar-week-events';

export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const [designCount, quoteCount, ugcCount, quotesWithFactory, favoriteFactories, waitlistLeadCount] = await Promise.all([
        prisma.design.count({ where: { brandId: brand.id, status: 'completed' } }),
        prisma.quote.count({ where: { brandId: brand.id } }),
        prisma.uGCContent.count({ where: { brandId: brand.id } }),
        prisma.quote.findMany({
            where: { brandId: brand.id },
            include: { factory: true },
        }),
        prisma.brandFavoriteFactory.findMany({
            where: { brandId: brand.id },
            include: { factory: true },
        }),
        prisma.waitlistLead.count({ where: { brandId: brand.id } }),
    ]);

    const suppliersMap = new Map<string, any>();

    for (const q of quotesWithFactory) {
        const f = q.factory;
        const existing = suppliersMap.get(f.id);
        if (existing) {
            existing.quoteCount += 1;
        } else {
            suppliersMap.set(f.id, {
                id: f.id,
                name: f.name,
                country: f.country,
                moq: f.moq,
                leadTime: f.leadTime,
                quoteCount: 1,
            });
        }
    }

    for (const fav of favoriteFactories) {
        const f = fav.factory;
        const existing = suppliersMap.get(f.id);
        if (!existing) {
            suppliersMap.set(f.id, {
                id: f.id,
                name: f.name,
                country: f.country,
                moq: f.moq,
                leadTime: f.leadTime,
                quoteCount: 0,
            });
        }
    }

    const suppliers = Array.from(suppliersMap.values());

    const lm = brand.launchMap;
    const completedPhases = [
        hasIdentity,
        lm?.phase1,
        lm?.phase2,
        lm?.phase3,
        lm?.phase4,
        lm?.phase6,
        lm?.phase7,
        lm?.phase8,
    ].filter(Boolean).length;
    const progressPercentage = Math.round((completedPhases / 9) * 100);

    const launchMapForClient = lm
        ? {
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
        }
        : null;

    const weekEvents = getWeekEvents(lm?.contentCalendar ?? null);

    return NextResponse.json({
        brand: { id: brand.id, name: brand.name, logo: brand.logo },
        launchMap: launchMapForClient,
        brandFull: brand,
        hasIdentity,
        designCount,
        quoteCount,
        ugcCount,
        progressPercentage,
        suppliers,
        waitlistLeadCount,
        weekEvents,
        userPlan: user.plan,
    });
}
