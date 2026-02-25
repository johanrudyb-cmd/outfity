import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { WelcomeCreatorClient } from './WelcomeCreatorClient';

export default async function WelcomeCreatorPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/signin');

    // Lire le plan depuis la DB (source de vérité) — le JWT peut être en retard après un paiement
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true, name: true },
    });

    // Si pas encore Creator en DB → retour dashboard
    if (!dbUser || dbUser.plan !== 'creator') {
        redirect('/dashboard');
    }

    return <WelcomeCreatorClient userName={dbUser.name || user.name || 'Créateur'} />;
}
