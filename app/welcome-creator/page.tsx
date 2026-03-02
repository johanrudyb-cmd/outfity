export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { WelcomeCreatorClient } from './WelcomeCreatorClient';
import { isPaidPlan } from '@/lib/plan-utils';

export default async function WelcomeCreatorPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/signin');

    // Lire le plan depuis la DB (source de vÃ©ritÃ©) â€” le JWT peut Ãªtre en retard aprÃ¨s un paiement
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true, name: true },
    });

    // Si pas encore un plan payant en DB â†’ retour dashboard 
    // On prÃ©serve le flag upgraded pour que UpgradeSessionRefresh puisse continuer de checker
    if (!dbUser || !isPaidPlan(dbUser.plan)) {
        redirect('/dashboard?upgraded=true');
    }

    // RÃ©cupÃ©rer la marque pour vÃ©rifier si la stratÃ©gie et le logo ont Ã©tÃ© faits
    const brand = await prisma.brand.findFirst({
        where: { userId: user.id },
        select: { id: true, logo: true, styleGuide: true, launchMap: { select: { phase1: true } } }
    });

    const hasStrategy = !!brand?.launchMap?.phase1 || !!brand?.styleGuide;
    const hasLogo = !!brand?.logo;

    return <WelcomeCreatorClient
        userName={dbUser.name || user.name || 'CrÃ©ateur'}
        hasStrategy={hasStrategy}
        hasLogo={hasLogo}
        brandId={brand?.id || null}
    />;
}

