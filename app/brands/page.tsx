import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { BrandsContent } from '@/components/brands/BrandsContent';
import { Suspense } from 'react';

export const metadata = {
  title: 'Marques tendances',
  description: 'Les marques les plus tendances de la semaine. Cliquez pour voir leurs produits ou aller sur leur site.',
};

async function BrandsContentWrapper() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  return <BrandsContent />;
}

export default function BrandsPage() {
  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16 max-w-7xl mx-auto space-y-8 sm:space-y-12 lg:space-y-16">
        <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <BrandsContentWrapper />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

