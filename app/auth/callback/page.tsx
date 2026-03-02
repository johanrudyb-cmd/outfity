export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function AuthCallbackPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin');
    }

    // 1. Si l'onboarding est dÃ©jÃ  marquÃ© fait dans l'objet user, on va au dashboard direct
    if (user.onboardingCompleted) {
        redirect('/dashboard');
    }

    // 2. SÃ©curitÃ© pour les anciens utilisateurs : 
    // S'ils ont dÃ©jÃ  une marque crÃ©Ã©e, on les envoie au dashboard (on pourrait aussi mettre Ã  jour onboardingCompleted Ã  true ici)
    const existingBrand = await prisma.brand.findFirst({
        where: { userId: user.id },
        select: { id: true }
    });

    if (existingBrand) {
        // Optionnel : marquer comme complÃ©tÃ© en DB pour les prochaines fois
        await prisma.user.update({
            where: { id: user.id },
            data: { onboardingCompleted: true }
        });
        redirect('/dashboard');
    }

    // 3. Si l'onboarding n'est pas fait et pas de marque, on commence par le choix de plan
    redirect('/auth/choose-plan');
}

