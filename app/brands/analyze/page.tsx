export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { AnalyzeTabs } from '@/components/brands/AnalyzeTabs';

export const metadata = {
  title: 'Analyse de marque & tendances',
  description: 'Analyse IA complète de marques mode et analyseur de tendances : positionnement, marketing, opportunités, prévisions.',
};

import { Suspense } from 'react';

export default async function BrandAnalyzePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Suspense fallback={<div className="h-20 animate-pulse bg-muted rounded-xl" />}>
          <AnalyzeTabs />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

