import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { subDays, format } from 'date-fns';

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '30d';
        const filterResourceId = searchParams.get('resourceId');

        const affiliate = await prisma.affiliate.findUnique({
            where: { userId: user.id },
            select: { id: true, commissionRate: true }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 });
        }

        let startDate = subDays(new Date(), 30);
        if (period === '7d') startDate = subDays(new Date(), 7);
        if (period === '90d') startDate = subDays(new Date(), 90);
        if (period === '1y') startDate = subDays(new Date(), 365);

        // On récupère tout GLOBALEMENT pour les compteurs
        const [allClicks, allCommissions, allSignups, activeSubsCount] = await Promise.all([
            prisma.affiliateClick.findMany({
                where: {
                    affiliateId: affiliate.id,
                    createdAt: { gte: startDate }
                },
                select: { createdAt: true, resourceId: true }
            }),
            prisma.affiliateCommission.findMany({
                where: {
                    affiliateId: affiliate.id,
                    createdAt: { gte: startDate }
                },
                select: { amount: true, createdAt: true }
            }),
            prisma.user.findMany({
                where: {
                    affiliateId: affiliate.id,
                    createdAt: { gte: startDate }
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    plan: true,
                    createdAt: true,
                    landingResourceId: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({
                where: {
                    affiliateId: affiliate.id,
                    plan: 'creator'
                }
            })
        ]);

        const mmr = (activeSubsCount || 0) * 29 * (affiliate.commissionRate || 0.15);

        // Grouper par jour avec filtrage par ressource pour le GRAPHIQUE
        const dailyData: Record<string, { date: string, clics: number, revenue: number }> = {};
        let current = new Date(startDate);
        const now = new Date();
        while (current <= now) {
            const dayKey = format(current, 'yyyy-MM-dd');
            dailyData[dayKey] = { date: dayKey, clics: 0, revenue: 0 };
            current.setDate(current.getDate() + 1);
        }

        allClicks.forEach((c: any) => {
            if (filterResourceId && c.resourceId !== filterResourceId) return;
            const dayKey = format(c.createdAt, 'yyyy-MM-dd');
            if (dailyData[dayKey]) dailyData[dayKey].clics++;
        });

        // Pour le filtrage du revenu, c'est délicat car non lié à resourceId.
        // On affiche le revenu global sur le graphique (ou filtré si on avait le lien).
        allCommissions.forEach((c: any) => {
            const dayKey = format(c.createdAt, 'yyyy-MM-dd');
            if (dailyData[dayKey]) dailyData[dayKey].revenue += c.amount;
        });

        const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

        // Calcul des clics par ressource (GLOBALE pour les badges)
        const clicksByResource: Record<string, number> = {};
        allClicks.forEach((c: any) => {
            const resId = c.resourceId || 'direct';
            clicksByResource[resId] = (clicksByResource[resId] || 0) + 1;
        });

        // Calcul des conversions par ressource (GLOBALE pour les badges)
        const convByResource: Record<string, number> = {};
        allSignups.forEach((s: any) => {
            const resId = s.landingResourceId || 'direct';
            convByResource[resId] = (convByResource[resId] || 0) + 1;
        });

        // Filtrage de la liste des signups si demandé
        const filteredSignups = filterResourceId
            ? allSignups.filter(s => s.landingResourceId === filterResourceId)
            : allSignups;

        const maskedSignups = filteredSignups.slice(0, 10).map(s => {
            const [local, domain] = s.email.split('@');
            return {
                id: s.id,
                name: s.name,
                plan: s.plan,
                createdAt: s.createdAt,
                email: `${local.substring(0, 2)}***@${domain}`
            };
        });

        return NextResponse.json({
            chartData,
            recentSignups: maskedSignups,
            mmr,
            activeSubsCount,
            clicksByResource,
            convByResource
        });
    } catch (error) {
        console.error('Error fetching affiliate personal stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
