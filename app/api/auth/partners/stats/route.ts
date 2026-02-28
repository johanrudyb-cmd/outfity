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

        const affiliate = await prisma.affiliate.findUnique({
            where: { userId: user.id },
            select: { id: true }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 });
        }

        let startDate = subDays(new Date(), 30);
        if (period === '7d') startDate = subDays(new Date(), 7);
        if (period === '90d') startDate = subDays(new Date(), 90);
        if (period === '1y') startDate = subDays(new Date(), 365);

        // Clis et Commissions personnels
        const [clicks, commissions, signups, activeSubsCount] = await Promise.all([
            prisma.affiliateClick.findMany({
                where: {
                    affiliateId: affiliate.id,
                    createdAt: { gte: startDate }
                },
                select: { createdAt: true }
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
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            prisma.user.count({
                where: {
                    affiliateId: affiliate.id,
                    plan: 'creator'
                }
            })
        ]);

        // Calcul de l'Estimated MMR (29€ * 15% par défaut si non spécifié, ou via affiliate)
        const affiliateData = await prisma.affiliate.findUnique({
            where: { id: affiliate.id },
            select: { commissionRate: true }
        });
        const mmr = (activeSubsCount || 0) * 29 * (affiliateData?.commissionRate || 0.15);

        // Grouper par jour pour le graphique
        const dailyData: Record<string, { date: string, clics: number, revenue: number }> = {};
        let current = new Date(startDate);
        const now = new Date();
        while (current <= now) {
            const dayKey = format(current, 'yyyy-MM-dd');
            dailyData[dayKey] = { date: dayKey, clics: 0, revenue: 0 };
            current.setDate(current.getDate() + 1);
        }

        clicks.forEach((c: { createdAt: Date }) => {
            const dayKey = format(c.createdAt, 'yyyy-MM-dd');
            if (dailyData[dayKey]) dailyData[dayKey].clics++;
        });

        commissions.forEach((c: { createdAt: Date, amount: number }) => {
            const dayKey = format(c.createdAt, 'yyyy-MM-dd');
            if (dailyData[dayKey]) dailyData[dayKey].revenue += c.amount;
        });

        const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

        // Anonymisation des emails des signups
        const maskedSignups = signups.map(s => {
            const [local, domain] = s.email.split('@');
            const maskedLocal = local.length > 2 ? local.substring(0, 2) + '***' : local + '***';
            return {
                ...s,
                email: `${maskedLocal}@${domain}`
            };
        });

        return NextResponse.json({
            chartData,
            recentSignups: maskedSignups,
            mmr,
            activeSubsCount
        });
    } catch (error) {
        console.error('Error fetching affiliate personal stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
