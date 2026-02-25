import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { WelcomeCreatorClient } from './WelcomeCreatorClient';

export default async function WelcomeCreatorPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/signin');
    // Si l'user n'est pas Creator, on le renvoie au dashboard
    if (user.plan !== 'creator') redirect('/dashboard');

    return <WelcomeCreatorClient userName={user.name || 'Créateur'} />;
}
