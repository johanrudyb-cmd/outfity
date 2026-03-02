export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TechPackCreator } from '@/components/trends/TechPackCreator';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

export default async function DesignStudioTechPackPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  const { id } = await searchParams;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <TechPackCreator preSelectedId={id ?? null} />
      </div>
    </DashboardLayout>
  );
}

