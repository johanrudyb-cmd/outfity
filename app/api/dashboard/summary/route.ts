import { NextResponse } from 'next/server';
import { getCurrentUser, getIsAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { isFreePlan } from '@/lib/plan-utils';
import { getWeekEvents } from '@/lib/calendar-week-events';

export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [isAdmin, affiliate, brand, launchMap, recentActivity] = await Promise.all([
        getIsAdmin(),
        prisma.affiliate.findUnique({
            where: { userId: user.id },
            select: { status: true },
        }),
        prisma.brand.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.launchMap.findFirst({
            where: { brand: { userId: user.id } },
        }),
        prisma.aIUsage.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        })
    ]);

    const isPartner = affiliate?.status === 'ACTIVE';
    const isFree = isFreePlan(user.plan);
    const hasIdentity = !!(brand?.logo || brand?.colorPalette || brand?.typography);
    const weekEvents = getWeekEvents(launchMap?.contentCalendar ?? null);

    // Compute progress
    const phaseDone = {
        phase0: hasIdentity,
        phase1: !!launchMap?.phase1,
        phase2: !!launchMap?.phase2,
        phase3: !!launchMap?.phase3,
        phase4: !!launchMap?.phase4,
        phase5: !!launchMap?.phase5,
    };

    // Extract first name
    const nameParts = user.name?.split(' ') ?? [];
    const firstName =
        nameParts.find((p) => p.length > 1 && /^[a-zA-Z\u00C0-\u017F\s\-]{2,}$/.test(p)) ??
        nameParts[0] ??
        'Créateur';
    const displayName =
        firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    return NextResponse.json({
        user: {
            id: user.id,
            name: user.name,
            displayName,
            firstName,
            plan: user.plan,
            isFree,
            isAdmin,
            isPartner,
        },
        brand: brand
            ? {
                id: brand.id,
                name: brand.name,
                logo: brand.logo,
            }
            : null,
        phaseDone,
        weekEvents,
        recentActivity,
        shopifyAffiliateUrl: process.env.NEXT_PUBLIC_SHOPIFY_AFFILIATE_URL || '',
    });
}
