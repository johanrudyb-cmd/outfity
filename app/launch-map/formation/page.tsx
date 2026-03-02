export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { FormationContent } from '@/components/launch-map/FormationContent';

export default async function FormationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  return <FormationContent />;
}

