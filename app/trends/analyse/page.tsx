import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrendsAnalyse } from '@/components/trends/TrendsAnalyse';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

export default async function TrendsAnalysePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <TrendsAnalyse userId={user.id} userPlan={user.plan || 'starter'} />
      </div>
    </DashboardLayout>
  );
}
