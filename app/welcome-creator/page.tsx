import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { WelcomeCreatorClient } from './WelcomeCreatorClient';
import { isPaidPlan } from '@/lib/plan-utils';

export default async function WelcomeCreatorPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/signin');

    // Lire le plan depuis la DB (source de vérité) — le JWT peut être en retard après un paiement
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true, name: true },
    });

    // Si pas encore un plan payant en DB → retour dashboard 
    // On préserve le flag upgraded pour que UpgradeSessionRefresh puisse continuer de checker
    if (!dbUser || !isPaidPlan(dbUser.plan)) {
        redirect('/dashboard?upgraded=true');
    }

    // Récupérer la marque pour vérifier si la stratégie et le logo ont été faits
    const brand = await prisma.brand.findFirst({
        where: { userId: user.id },
        select: { logo: true, styleGuide: true, launchMap: { select: { phase1: true } } }
    });

    const hasStrategy = !!brand?.launchMap?.phase1 || !!brand?.styleGuide;
    const hasLogo = !!brand?.logo;

    return <WelcomeCreatorClient
        userName={dbUser.name || user.name || 'Créateur'}
        hasStrategy={hasStrategy}
        hasLogo={hasLogo}
    />;
}
