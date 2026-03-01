import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';

export default async function AuthCallbackPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin');
    }

    // 1. Si l'onboarding est déjà fait, on va au dashboard direct
    if (user.onboardingCompleted) {
        redirect('/dashboard');
    }

    // 2. Si l'onboarding n'est pas fait, on vérifie s'il a déjà un plan
    // (Par défaut un nouvel utilisateur est "free", mais s'il vient d'un flow spécifique il pourrait déjà avoir un plan)
    // Mais ici le besoin est : "choix de plan la première fois avant l'onboarding"

    // On redirige vers choose-plan qui est la porte d'entrée de l'onboarding pour les nouveaux
    redirect('/auth/choose-plan');
}
