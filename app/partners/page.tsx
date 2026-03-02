export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PartnerDashboardClient } from '@/components/partners/PartnerDashboardClient';

// RÃ©cupÃ©rer les infos essentielles de l'affiliÃ©
async function getAffiliateData(userId: string) {
    return await prisma.affiliate.findUnique({
        where: { userId },
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
}

export default async function PartnersPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin?callbackUrl=/partners');
    }

    // RÃ©cupÃ©rer les donnÃ©es rÃ©elles de l'affiliÃ©
    const affiliate = await getAffiliateData(user.id);

    // Si l'utilisateur n'est pas un partenaire approuvÃ©, on redirige vers une page info ou dashboard
    if (!affiliate || affiliate.status !== 'ACTIVE') {
        redirect('/dashboard?error=not_affiliate');
    }

    // On passe les donnÃ©es au client component pour l'interactivitÃ© (toast, navigation, etc)
    return <PartnerDashboardClient user={user as any} affiliate={affiliate as any} />;
}

