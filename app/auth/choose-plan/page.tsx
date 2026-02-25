import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { ChoosePlanClient } from './ChoosePlanClient';

export default async function ChoosePlanPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin?redirect=/auth/choose-plan');
  }
  // Un user déjà Creator n'a rien à faire ici
  if (user.plan === 'creator') {
    redirect('/settings?tab=billing');
  }
  return <ChoosePlanClient userPlan={user.plan} />;
}
