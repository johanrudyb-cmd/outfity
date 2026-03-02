export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { BrandTrendsAnalyzeTabs } from '@/components/brands/BrandTrendsAnalyzeTabs';

export const metadata = {
  title: 'Analyse des marques tendances',
  description:
    'Analyse IA des marques tendances : positionnement, canaux, pricing, opportunitÃ©s. Analyseur de tendances & prÃ©visions IA. Dupliquez la stratÃ©gie pour votre marque.',
};

export default async function BrandTrendsAnalyzePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col">
          <Suspense fallback={<div className="flex items-center justify-center flex-1"><span className="text-muted-foreground">Chargementâ€¦</span></div>}>
            <BrandTrendsAnalyzeTabs />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}

