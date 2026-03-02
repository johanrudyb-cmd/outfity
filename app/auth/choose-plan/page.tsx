export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { isPaidPlan } from '@/lib/plan-utils';
import { ChoosePlanClient } from './ChoosePlanClient';

export default async function ChoosePlanPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin?redirect=/auth/choose-plan');
  }
  // On laisse l'utilisateur voir les plans s'il n'est pas dÃ©jÃ  payant. 
  // La redirection automatique au login est gÃ©rÃ©e par /auth/callback.

  // Un user dÃ©jÃ  Creator (payant) n'a rien Ã  faire ici
  if (isPaidPlan(user.plan)) {
    redirect('/settings?tab=billing');
  }
  return <ChoosePlanClient userPlan={user.plan} />;
}

