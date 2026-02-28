import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIsAdmin } from '@/lib/auth-helpers';
import { startOfDay, startOfMonth, startOfYear, subDays, format } from 'date-fns';

export async function GET(req: Request) {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

        let startDate = subDays(new Date(), 30);
        if (period === '7d') startDate = subDays(new Date(), 7);
        if (period === '90d') startDate = subDays(new Date(), 90);
        if (period === '1y') startDate = subDays(new Date(), 365);

        // Récupérer tous les clics et commissions depuis startDate
        const [clicks, commissions] = await Promise.all([
            prisma.affiliateClick.findMany({
                where: { createdAt: { gte: startDate } },
                select: { createdAt: true }
            }),
            prisma.affiliateCommission.findMany({
                where: { createdAt: { gte: startDate } },
                select: { amount: true, createdAt: true }
            })
        ]);

        // Grouper par jour pour le graphique
        const dailyData: Record<string, { date: string, clics: number, revenue: number }> = {};

        // Initialiser tous les jours de la période pour éviter les trous dans le graph
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

        // Stats agrégées (Mois en cours vs Précédent)
        const currentMonthStart = startOfMonth(new Date());
        const lastMonthStart = startOfMonth(subDays(currentMonthStart, 5)); // Environ le mois dernier

        const stats = {
            currentMonth: await getPeriodStats(currentMonthStart, now),
            lastMonth: await getPeriodStats(lastMonthStart, currentMonthStart),
            chartData
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching partner stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function getPeriodStats(start: Date, end: Date) {
    const [clicks, commissions] = await Promise.all([
        prisma.affiliateClick.count({
            where: { createdAt: { gte: start, lt: end } }
        }),
        prisma.affiliateCommission.aggregate({
            where: { createdAt: { gte: start, lt: end } },
            _sum: { amount: true }
        })
    ]);

    return {
        clicks,
        revenue: commissions._sum.amount || 0
    };
}
