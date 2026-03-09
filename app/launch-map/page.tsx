export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { LaunchMapOverview } from '@/components/launch-map/LaunchMapOverview';

export default async function LaunchMapPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  return <LaunchMapOverview />;
}


