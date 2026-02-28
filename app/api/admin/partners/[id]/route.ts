import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getIsAdmin } from '@/lib/auth-helpers';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: affiliateId } = await params;

        const affiliate = await prisma.affiliate.findUnique({
            where: { id: affiliateId },
            include: {
                _count: {
                    select: { clicks: true, commissions: true }
                },
                commissions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        const commissionRate = affiliate.commissionRate || 0.3;

        // --- MMC & ACTIVE SUBSCRIPTIONS CALCULATION ---
        // We look for active subscriptions in Stripe that have this affiliate's referral code
        let activeSubscriptionsCount = 0;
        let mmr = 0;

        if (stripe) {
            try {
                // Search for active subscriptions with the affiliate metadata
                // Note: Stripe search can be slightly delayed, but it's the best way for real-time MMR
                const search = await stripe.subscriptions.search({
                    query: `status:'active' AND metadata['affiliateCode']:'${affiliate.referralCode}'`,
                });

                activeSubscriptionsCount = search.data.length;
                // MMR = Active Subs * 29€ * Commission Rate
                // Each sub is 29€, affiliate gets 30% (affiliate.commissionRate)
                mmr = search.data.reduce((acc, sub) => {
                    // For safety, we use the actual sub price if possible, or fallback to 29
                    const price = sub.items.data[0]?.price.unit_amount
                        ? sub.items.data[0].price.unit_amount / 100
                        : 29;
                    return acc + (price * commissionRate);
                }, 0);
            } catch (err) {
                console.error("[Stats API] Stripe search error:", err);
            }
        }

        // Total Generated Revenue (CA) = Total amount of all commissions / 0.3
        // Since commission is 30% of price, Price = Commission / 0.3
        const commissionsSum = await prisma.affiliateCommission.aggregate({
            where: { affiliateId: affiliate.id, status: 'PAID' },
            _sum: { amount: true }
        });

        const totalCommissionPaid = commissionsSum._sum.amount || 0;
        const totalGeneratedCA = totalCommissionPaid / commissionRate;
        const netProfitForPlatform = totalGeneratedCA - totalCommissionPaid;

        return NextResponse.json({
            ...affiliate,
            stats: {
                totalClicks: affiliate._count.clicks,
                activeSubscribers: activeSubscriptionsCount,
                mmr: mmr,
                totalGeneratedCA: totalGeneratedCA,
                totalCommissionToPay: totalCommissionPaid - affiliate.earningsPaid, // Remaining to pay
                netProfit: netProfitForPlatform,
                commissionRate: commissionRate
            }
        });
    } catch (error) {
        console.error('Error fetching partner detail stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();

        const updated = await prisma.affiliate.update({
            where: { id },
            data: {
                status: body.status,
                commissionRate: body.commissionRate ? parseFloat(body.commissionRate) : undefined,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating partner:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await getIsAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // On supprime d'abord les dépendances (clics, commissions si nécessaire, ou on les garde si c'est important pour la compta)
        // Ici on va faire une suppression propre
        await prisma.$transaction([
            prisma.affiliateClick.deleteMany({ where: { affiliateId: id } }),
            prisma.affiliateCommission.deleteMany({ where: { affiliateId: id } }),
            prisma.affiliate.delete({ where: { id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting partner:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
