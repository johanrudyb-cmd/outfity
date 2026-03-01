import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrendPredictions } from '@/components/trends/TrendPredictions';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

export default async function TrendPredictionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <TrendPredictions userId={user.id} userPlan={user.plan || 'starter'} />
      </div>
    </DashboardLayout>
  );
}
